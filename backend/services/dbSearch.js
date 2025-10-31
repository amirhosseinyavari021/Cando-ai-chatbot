// backend/services/dbSearch.js
// (NEW FILE)
import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Faq from '../models/Faq.js';
import logger from '../middleware/logger.js';

const MAX_CONTEXT_CHARS = 4000;

/**
 * Creates a regex for partial and flexible Persian word matching.
 * @param {string} query - The user's query.
 * @returns {RegExp} - A regex object.
 */
const createPersianRegex = (query) => {
  // Simple word extraction, ignoring very short words
  const words = query.split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) {
    // Fallback for short queries
    return new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }
  // Match any of the extracted words
  const regexPattern = words.join('|');
  return new RegExp(regexPattern, 'i'); // 'i' for case-insensitive
};

/**
 * Retrieves RAG context from both FAQs and Courses.
 * Implements $text search with a regex fallback.
 * @param {string} userMessage - The user's message.
 * @returns {Promise<string>} - A formatted context string.
 */
export const getRAGContext = async (userMessage) => {
  let contextParts = [];

  try {
    // --- Step 1: $text search (Primary) ---
    const textSearchQuery = { $text: { $search: userMessage } };
    const scoreProjection = { score: { $meta: 'textScore' } };
    const sort = { score: { $meta: 'textScore' } };

    const [faqResults, courseResults] = await Promise.all([
      Faq.find(textSearchQuery, scoreProjection).sort(sort).limit(5).lean(),
      Course.find(textSearchQuery, scoreProjection).sort(sort).limit(5).lean(),
    ]);

    let allResults = [
      ...faqResults.map((f) => ({ ...f, type: 'faq' })),
      ...courseResults.map((c) => ({ ...c, type: 'course' })),
    ];

    // --- Step 2: Regex fallback (Secondary) ---
    if (allResults.length < 3) {
      logger.info('RAG: $text search yielded few results, trying regex fallback...');
      const regex = createPersianRegex(userMessage);

      // Search fields for regex
      const faqRegexQuery = { $or: [{ question: regex }, { answer: regex }] };
      const courseRegexQuery = { $or: [{ 'دوره': regex }, { 'استاد': regex }] };

      const [faqRegex, courseRegex] = await Promise.all([
        Faq.find(faqRegexQuery).limit(3).lean(),
        Course.find(courseRegexQuery).limit(3).lean(),
      ]);

      // Add non-duplicate results
      const existingIds = new Set(allResults.map((r) => r._id.toString()));
      faqRegex.forEach((f) => {
        if (!existingIds.has(f._id.toString())) {
          allResults.push({ ...f, type: 'faq' });
        }
      });
      courseRegex.forEach((c) => {
        if (!existingIds.has(c._id.toString())) {
          allResults.push({ ...c, type: 'course' });
        }
      });
    }

    // --- Step 3: Format the context string ---
    if (allResults.length === 0) {
      logger.info('RAG: No context found.');
      return ''; // Return empty string if no context
    }

    // Format FAQs
    const faqContext = allResults
      .filter((r) => r.type === 'faq')
      .map((f) => `سوال: ${f.question}\nپاسخ: ${f.answer}`)
      .join('\n\n');

    // Format Courses
    const courseContext = allResults
      .filter((r) => r.type === 'course')
      .map((c) => {
        // Use the Persian fields as requested
        return [
          `دوره: ${c['دوره'] || c.title || 'N/A'}`,
          `استاد: ${c['استاد'] || c.instructor_name || 'N/A'}`,
          `شیوه برگزاری: ${c['شیوه برگزاری'] || c.mode || 'N/A'}`,
          `تاریخ شروع: ${c['تاریخ شروع'] || 'N/A'}`,
          `شهریه: ${c['شهریه آنلاین با تخفیف'] || 'N/A'}`,
        ].join('\n');
      })
      .join('\n\n');

    if (faqContext) {
      contextParts.push('--- اطلاعات پرسش‌های متداول ---\n' + faqContext);
    }
    if (courseContext) {
      contextParts.push('--- اطلاعات دوره‌ها ---\n' + courseContext);
    }

    let fullContext = contextParts.join('\n\n');

    // Truncate to max length
    if (fullContext.length > MAX_CONTEXT_CHARS) {
      logger.warn(`RAG: Context truncated from ${fullContext.length} to ${MAX_CONTEXT_CHARS} chars.`);
      fullContext = fullContext.substring(0, MAX_CONTEXT_CHARS);
    }

    logger.info(`RAG: Context prepared (${fullContext.length} chars).`);
    return fullContext;

  } catch (err) {
    logger.error(`❌ RAG Error: ${err.message}`);
    return ''; // Return empty string on error
  }
};