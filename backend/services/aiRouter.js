// backend/services/aiRouter.js
import { callPrimary } from '../ai/adapters/openaiPrimary.js';
import { callLocal } from '../ai/adapters/localFallback.js';
import { createLogEntry } from '../middleware/logger.js';
import logger from '../middleware/logger.js';
import aiConfig from '../config/ai.js';

import Course from '../models/Course.js';
import Faq from '../models/Faq.js';
// اگر Instructor مدل داری، آن‌را باز کن:
// import Instructor from '../models/Instructor.js';

import { appendTurn, getHistory } from './conversationMemory.js';

const {
  AI_TIMEOUT_MS = 15000,
  AI_FALLBACK_ENABLED = true,
  AI_PRIMARY_MODEL = 'gpt-4.1',
  AI_LOCAL_MODEL_NAME = 'qwen2:7b-instruct',
} = aiConfig;

const createTimeout = (ms) =>
  new Promise((_, rej) => setTimeout(() => rej(new Error(`AI Timeout: ${ms}ms`)), ms));

function sanitizeAnswer(s) {
  if (!s) return s;
  const patterns = [
    /(?:در|از) (?:FAQ|دیتابیس|پایگاه داده|courses|instructors) (?:چک|جستجو) (?:می‌کنم|کردم)[^\.!\n]*[\.!\n]?/gi,
    /من اول (?:FAQ|پایگاه داده) را چک می‌کنم[^\.!\n]*[\.!\n]?/gi,
    /در دیتابیس اطلاعاتی نبود[^\.!\n]*[\.!\n]?/gi,
  ];
  let out = s;
  for (const p of patterns) out = out.replace(p, '');
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

function minifyContext(sections, maxChars = 1400) {
  const out = [];
  let used = 0;
  for (const s of sections) {
    if (!s) continue;
    const add = s.slice(0, Math.min(s.length, 400));
    if (used + add.length > maxChars) break;
    out.push(add);
    used += add.length;
  }
  return out.join('\n\n');
}

async function getContextFromDB(userMessage) {
  const parts = [];
  try {
    // FAQ
    const faq = await Faq.find(
      { $text: { $search: userMessage } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(3)
      .select('question answer');

    if (faq.length) {
      parts.push(
        '--- FAQ ---\n' + faq.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n')
      );
    }

    // Courses
    const courses = await Course.find(
      { $text: { $search: userMessage } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(5)
      .select('title instructor_name registration_status mode start_date price');

    if (courses.length) {
      parts.push(
        '--- Courses ---\n' +
        courses
          .map(
            (c) =>
              `عنوان: ${c.title} | استاد: ${c.instructor_name} | وضعیت: ${c.registration_status} | نوع: ${c.mode} | شروع: ${c.start_date} | قیمت: ${c.price}`
          )
          .join('\n')
      );
    }

    // Instructors (در صورت وجود مدل)
    // const instructors = await Instructor.find(
    //   { $text: { $search: userMessage } },
    //   { score: { $meta: 'textScore' } }
    // ).sort({ score: { $meta: 'textScore' } }).limit(3).select('name bio courses');
    // if (instructors.length) {
    //   parts.push('--- Instructors ---\n' + instructors.map(i => `نام: ${i.name} | دوره‌ها: ${Array.isArray(i.courses) ? i.courses.join(', ') : i.courses}`).join('\n'));
    // }

    if (!parts.length) {
      logger.info(`RAG: No context for "${userMessage}"`);
      return '';
    }
    return minifyContext(parts);
  } catch (e) {
    logger.error(`RAG error: ${e.message}`);
    return '';
  }
}

export const routeRequest = async (userMessage, userId = 'anonymous', sessionId = 'anon-session') => {
  const started = Date.now();
  let primaryError = null;

  // History
  const history = await getHistory(sessionId);

  // RAG
  const dbContext = await getContextFromDB(userMessage);

  const userMessageWithHistory = history
    ? `### Chat History\n${history}\n\n### User Message\n${userMessage}`
    : userMessage;

  // --- Primary Call
  try {
    const result = await Promise.race([
      callPrimary(userMessageWithHistory, dbContext), // با variables
      createTimeout(AI_TIMEOUT_MS),
    ]);

    const clean = sanitizeAnswer(result.text);
    await appendTurn({ sessionId, userId, role: 'user', text: userMessage });
    await appendTurn({ sessionId, userId, role: 'assistant', text: clean });

    await createLogEntry({
      userId,
      requestType: 'TEXT',
      modelUsed: AI_PRIMARY_MODEL,
      status: 'SUCCESS',
      prompt: userMessage,
      response: clean,
      latency: Date.now() - started,
    });

    return { text: clean, didFallback: false };
  } catch (err) {
    // اگر پرامپت متغیّر را نشناخت → ریتری با تزریق inline
    if (/Unknown prompt variables:.*db_context/i.test(err.message) || /400/.test(err.message)) {
      try {
        const retryResult = await Promise.race([
          callPrimary(
            `${dbContext ? `### Context\n${dbContext}\n\n` : ''}${userMessageWithHistory}`,
            null // null => بدون ارسال db_context به عنوان variable
          ),
          createTimeout(AI_TIMEOUT_MS),
        ]);
        const clean = sanitizeAnswer(retryResult.text);
        await appendTurn({ sessionId, userId, role: 'user', text: userMessage });
        await appendTurn({ sessionId, userId, role: 'assistant', text: clean });

        await createLogEntry({
          userId,
          requestType: 'TEXT',
          modelUsed: AI_PRIMARY_MODEL,
          status: 'SUCCESS_RETRY_INLINE',
          prompt: userMessage,
          response: clean,
          latency: Date.now() - started,
        });

        return { text: clean, didFallback: false };
      } catch (e) {
        primaryError = e;
        logger.warn(`Retry-inline failed: ${e.message}`);
      }
    } else {
      primaryError = err;
      logger.warn(`Primary failed: ${err.message}`);
    }
  }

  // --- Fallback
  if (AI_FALLBACK_ENABLED) {
    try {
      const fb = await callLocal(userMessageWithHistory, dbContext);
      const clean = sanitizeAnswer(fb.text);

      await appendTurn({ sessionId, userId, role: 'user', text: userMessage });
      await appendTurn({ sessionId, userId, role: 'assistant', text: clean });

      await createLogEntry({
        userId,
        requestType: 'TEXT',
        modelUsed: AI_LOCAL_MODEL_NAME,
        status: 'FALLBACK_SUCCESS',
        prompt: userMessage,
        response: clean,
        latency: Date.now() - started,
        errorMessage: `Primary Error: ${primaryError?.message || 'N/A'}`,
      });

      return { text: clean, didFallback: true };
    } catch (fbErr) {
      primaryError = fbErr;
    }
  }

  await createLogEntry({
    userId,
    requestType: 'TEXT',
    modelUsed: 'NONE',
    status: 'ERROR',
    prompt: userMessage,
    errorMessage: primaryError?.message || 'All failed',
    latency: Date.now() - started,
  });

  throw new Error(primaryError?.message || 'AI unavailable');
};
