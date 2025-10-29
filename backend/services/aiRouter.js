import { callPrimary } from '../ai/adapters/openaiPrimary.js';
import { callLocal } from '../ai/adapters/localFallback.js';
import { createLogEntry } from '../middleware/logger.js';
import logger from '../middleware/logger.js';
import aiConfig from '../config/ai.js';

// --- IMPORT MODELS FOR RAG ---
import Course from '../models/Course.js';
import Faq from '../models/Faq.js';

const {
  AI_TIMEOUT_MS,
  AI_FALLBACK_ENABLED,
  AI_PRIMARY_MODEL,
  AI_LOCAL_MODEL_NAME,
} = aiConfig;

/**
 * Creates a promise that rejects after a specified timeout.
 */
const createTimeout = (ms) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`AI Timeout: Request exceeded ${ms}ms`));
    }, ms);
  });
};

/**
 * --- RAG SEARCH FUNCTION (نسخه نهایی با کیفیت بالا) ---
 * دو جستجوی موازی (متنی و عبارتی) در دیتابیس اجرا کرده و نتایج را ادغام می‌کند.
 * @param {string} userMessage - The user's query.
 * @returns {Promise<string>} - A formatted context string.
 */
const getContextFromDB = async (userMessage) => {
  let contextParts = [];

  try {
    // --- جستجوی دوره‌ها (Courses) ---
    // کوئری ۱: جستجوی متنی (سریع، استفاده از ایندکس text)
    const courseTextQuery = Course.find(
      { $text: { $search: userMessage } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(3)
      .select('id title instructor_name registration_status mode start_date price');

    // کوئری ۲: جستجوی عبارتی (سریع، استفاده از ایندکس‌های title: 1 و instructor_name: 1)
    const courseRegexQuery = Course.find({
      $or: [
        { instructor_name: { $regex: userMessage, $options: 'i' } },
        { title: { $regex: userMessage, $options: 'i' } },
      ],
    })
      .limit(3)
      .select('id title instructor_name registration_status mode start_date price');

    // --- جستجوی سوالات متداول (FAQ) ---
    const faqQuery = Faq.find(
      { $text: { $search: userMessage } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(3)
      .select('question answer');

    // --- اجرای همزمان هر سه کوئری ---
    const [coursesText, coursesRegex, faqs] = await Promise.all([
      courseTextQuery,
      courseRegexQuery,
      faqQuery,
    ]);

    // --- ادغام نتایج دوره‌ها (حذف موارد تکراری) ---
    const allCourses = new Map();
    coursesText.forEach(course => allCourses.set(course.id, course));
    coursesRegex.forEach(course => allCourses.set(course.id, course));

    const uniqueCourses = Array.from(allCourses.values());

    // ساخت Context برای دوره‌ها
    if (uniqueCourses.length > 0) {
      let courseContext = "--- اطلاعات دوره‌های یافت شده ---\n";
      uniqueCourses.forEach(c => {
        courseContext += `دوره: ${c.title} (استاد: ${c.instructor_name}, وضعیت: ${c.registration_status}, نوع: ${c.mode}, شروع: ${c.start_date}, قیمت: ${c.price})\n`;
      });
      contextParts.push(courseContext);
      logger.info(`RAG: Found ${uniqueCourses.length} unique courses.`);
    }

    // ساخت Context برای سوالات متداول
    if (faqs.length > 0) {
      let faqContext = "--- اطلاعات از سوالات متداول ---\n";
      faqs.forEach(f => {
        faqContext += `سوال: ${f.question}\nپاسخ: ${f.answer}\n`;
      });
      contextParts.push(faqContext);
      logger.info(`RAG: Found ${faqs.length} FAQs.`);
    }

    if (contextParts.length === 0) {
      logger.info(`RAG: No context found in DB for: "${userMessage}"`);
      return ""; // No context found
    }

    return contextParts.join('\n\n');

  } catch (error) {
    logger.error(`RAG Search Error: ${error.message}`);
    return ""; // Return empty context on search failure
  }
};

/**
 * Routes a user's AI request, WITH RAG, to primary or fallback.
 * (این بخش بدون تغییر باقی می‌ماند)
 */
export const routeRequest = async (userMessage, userId = 'anonymous') => {
  const startTime = Date.now();
  let primaryError = null;

  // --- STEP 1: RAG (Get Context) ---
  const dbContext = await getContextFromDB(userMessage);

  // --- STEP 2: Try Primary AI (with Context) ---
  try {
    logger.info(`Attempting Primary AI call... (Timeout: ${AI_TIMEOUT_MS}ms)`);

    const result = await Promise.race([
      callPrimary(userMessage, dbContext), // Pass context
      createTimeout(AI_TIMEOUT_MS),
    ]);

    // If successful (no timeout)
    const latency = Date.now() - startTime;
    await createLogEntry({
      userId,
      requestType: 'TEXT',
      modelUsed: AI_PRIMARY_MODEL,
      status: 'SUCCESS',
      prompt: userMessage,
      response: result.text,
      latency: latency,
    });
    return { text: result.text, didFallback: false };
  } catch (error) {
    logger.warn(`Primary AI failed or timed out: ${error.message}`);
    primaryError = error;
  }

  // --- STEP 3: Try Fallback AI (if enabled) ---
  if (AI_FALLBACK_ENABLED) {
    logger.info('Primary failed, attempting Fallback AI...');
    try {
      const fallbackResult = await callLocal(userMessage, dbContext); // Pass context
      const latency = Date.now() - startTime;

      await createLogEntry({
        userId,
        requestType: 'TEXT',
        modelUsed: AI_LOCAL_MODEL_NAME,
        status: 'FALLBACK_SUCCESS',
        prompt: userMessage,
        response: fallbackResult.text,
        latency: latency,
        errorMessage: `Primary Error: ${primaryError?.message || 'N/A'}`,
      });
      return { text: fallbackResult.text, didFallback: true };
    } catch (fallbackError) {
      logger.error(`Fallback AI also failed: ${fallbackError.message}`);
      primaryError = fallbackError; // This is now the final error
    }
  }

  // --- If all else fails ---
  const latency = Date.now() - startTime;
  await createLogEntry({
    userId,
    requestType: 'TEXT',
    modelUsed: 'NONE',
    status: 'ERROR',
    prompt: userMessage,
    errorMessage: primaryError?.message || 'All AI services failed.',
    latency: latency,
  });

  throw new Error(
    primaryError?.message || 'AI services are currently unavailable.'
  );
};