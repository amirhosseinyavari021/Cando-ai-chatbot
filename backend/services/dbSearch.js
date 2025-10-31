import mongoose from 'mongoose';
import natural from 'natural';
import Course from '../../models/Course.js';
import Faq from '../../models/Faq.js';
import logger from '../../middleware/logger.js';

const MAX_CONTEXT_CHARS = 4000;
const { WordTokenizer, PorterStemmer } = natural;
const tokenizer = new WordTokenizer();
// Using PorterStemmer as a generic stemmer; for Persian, this is basic
// but matches the original implementation's intent.
const stemmer = PorterStemmer;

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
 * Scores documents based on token overlap with the query.
 * @param {Array<object>} docs - The documents from MongoDB.
 * @param {Array<string>} textFields - The fields to search within.
 * @param {Array<string>} queryTokens - The stemmed query tokens.
 * @returns {Array<object>} - The documents scored and sorted.
 */
const scoreDocs = (docs, textFields, queryTokens) => {
  return docs
    .map((doc) => {
      // Combine all text fields into one string
      const docText = textFields
        .map((f) => doc[f])
        .join(' ');

      // Tokenize and stem
      const tokens = tokenizer
        .tokenize(docText)
        .map((t) => stemmer.stem(t));

      // Calculate overlap score
      const overlap = tokens.filter((t) => queryTokens.includes(t)).length;
      const score = overlap / Math.max(tokens.length, 1);
      return { ...doc, score };
    })
    .filter((d) => d.score > 0.1) // Filter out low-score docs
    .sort((a, b) => b.score - a.score); // Sort by best score
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
    const queryTokens = tokenizer
      .tokenize(userMessage)
      .map((t) => stemmer.stem(t));

    // --- Step 1: $text search (Primary) ---
    const textSearchQuery = { $text: { $search: userMessage } };
    const scoreProjection = { score: { $meta: 'textScore' } };
    const sort = { score: { $meta: 'textScore' } };

    let [faqResults, courseResults] = await Promise.all([
      Faq.find(textSearchQuery, scoreProjection).sort(sort).limit(5).lean(),
      Course.find(textSearchQuery, scoreProjection).sort(sort).limit(10).lean(), // Prioritize courses
    ]);

    // --- Step 2: Regex fallback (Secondary) ---
    if (courseResults.length < 3 || faqResults.length < 3) {
      logger.info('RAG: $text search yielded few results, trying regex fallback...');
      const regex = createPersianRegex(userMessage);

      const [faqRegex, courseRegex] = await Promise.all([
        // Only fetch if $text search was insufficient
        faqResults.length < 3
          ? Faq.find({ $or: [{ question: regex }, { answer: regex }] })
            .limit(3)
            .lean()
          : Promise.resolve([]),
        courseResults.length < 3
          ? Course.find({
            $or: [
              { 'دوره': regex },
              { 'استاد': regex },
              { 'توضیح': regex }, // Search the new 'توضیح' field
              { title: regex },   // Keep searching old fields
            ],
          })
            .limit(5)
            .lean()
          : Promise.resolve([]),
      ]);

      // Score and merge regex results, avoiding duplicates
      const existingIds = new Set([
        ...faqResults.map((r) => r._id.toString()),
        ...courseResults.map((r) => r._id.toString()),
      ]);

      const scoredFaqRegex = scoreDocs(
        faqRegex.filter((f) => !existingIds.has(f._id.toString())),
        ['question', 'answer'],
        queryTokens
      );

      const scoredCourseRegex = scoreDocs(
        courseRegex.filter((c) => !existingIds.has(c._id.toString())),
        ['دوره', 'استاد', 'توضیح', 'title'],
        queryTokens
      );

      faqResults = [...faqResults, ...scoredFaqRegex].sort(
        (a, b) => (b.score || 0) - (a.score || 0)
      );
      courseResults = [...courseResults, ...scoredCourseRegex].sort(
        (a, b) => (b.score || 0) - (a.score || 0)
      );
    }

    // --- Step 3: Format the context string (Courses First) ---

    // Format Courses
    const courseContext = courseResults
      .slice(0, 5) // Limit to top 5 courses
      .map((c) => {
        // Use the simplified Persian fields
        return [
          `دوره: ${c['دوره'] || c.title || 'N/A'}`,
          `استاد: ${c['استاد'] || c.instructor_name || 'N/A'}`,
          `توضیح: ${c['توضیح'] || 'N/A'}`, // Add the new field
          `شیوه برگزاری: ${c['شیوه برگزاری'] || c.mode || 'N/A'}`,
          `شهریه: ${c['شهریه آنلاین با تخفیف'] || c.price || 'N/A'}`,
        ].join('\n');
      })
      .join('\n\n');

    // Format FAQs
    const faqContext = faqResults
      .slice(0, 3) // Limit to top 3 FAQs
      .map((f) => `سوال: ${f.question}\nپاسخ: ${f.answer}`)
      .join('\n\n');

    // Add to context parts, courses first as requested
    if (courseContext) {
      contextParts.push('--- اطلاعات دوره‌ها ---\n' + courseContext);
    }
    if (faqContext) {
      contextParts.push('--- اطلاعات پرسش‌های متداول ---\n' + faqContext);
    }

    let fullContext = contextParts.join('\n\n');

    // Truncate to max length
    if (fullContext.length > MAX_CONTEXT_CHARS) {
      logger.warn(
        `RAG: Context truncated from ${fullContext.length} to ${MAX_CONTEXT_CHARS} chars.`
      );
      fullContext = fullContext.substring(0, MAX_CONTEXT_CHARS);
    }

    logger.info(`RAG: Context prepared (${fullContext.length} chars).`);
    return fullContext;
  } catch (err) {
    logger.error(`❌ RAG Error: ${err.message}`);
    return ''; // Return empty string on error
  }
};