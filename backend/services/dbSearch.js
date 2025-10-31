// backend/services/dbSearch.js
import natural from 'natural';
import Course from '../models/Course.js';
import Faq from '../models/Faq.js';
import logger from '../middleware/logger.js';

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer; // Using Porter as a generic stemmer
const MAX_CONTEXT_CHARS = 4000;

/**
 * Scores documents based on token overlap with the query.
 * (Used for regex fallback)
 */
const scoreDocs = (docs, textFields, queryTokens) => {
  return docs
    .map((doc) => {
      const docText = textFields
        .map((f) => doc[f] || '') // Handle missing fields
        .join(' ');

      if (!docText) return { ...doc, score: 0 };

      const tokens = tokenizer
        .tokenize(docText)
        .map((t) => stemmer.stem(t));

      const overlap = tokens.filter((t) => queryTokens.includes(t)).length;
      const score = overlap / Math.max(tokens.length, 1);
      return { ...doc, score };
    })
    .filter((d) => d.score > 0.1)
    .sort((a, b) => b.score - a.score);
};

/**
 * Creates a flexible regex from the user's query.
 */
const createRegex = (query) => {
  const words = query.split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) {
    return new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }
  const regexPattern = words.join('|');
  return new RegExp(regexPattern, 'i');
};

/**
 * Retrieves RAG context from DB.
 * - Uses weighted $text search.
 * - Uses regex fallback on new course fields.
 * - Prioritizes Course context over FAQ context.
 */
export const getContextFromDB = async (userMessage) => {
  const queryTokens = tokenizer
    .tokenize(userMessage)
    .map((t) => stemmer.stem(t));

  const textSearchQuery = { $text: { $search: userMessage } };
  const scoreProjection = { score: { $meta: 'textScore' } };
  const sort = { score: { $meta: 'textScore' } };

  let courseContext = '';
  let faqContext = '';

  try {
    // --- Step 1: $text search (Primary) ---
    let [courses, faqs] = await Promise.all([
      Course.find(textSearchQuery, scoreProjection).sort(sort).limit(5).lean(),
      Faq.find(textSearchQuery, scoreProjection).sort(sort).limit(3).lean(),
    ]);

    // --- Step 2: Regex fallback (Secondary) ---
    if (courses.length < 2) {
      logger.info('RAG: $text search for courses weak, trying regex fallback...');
      const regex = createRegex(userMessage);
      const regexQuery = {
        $or: [
          { 'دوره': regex },
          { 'استاد': regex },
          { 'توضیح': regex },
          { 'نوع برگزاری': regex },
          { title: regex },
          { instructor_name: regex },
        ],
      };
      const regexCourses = await Course.find(regexQuery).limit(3).lean();

      const existingIds = new Set(courses.map(c => c._id.toString()));
      const newCourses = regexCourses.filter(c => !existingIds.has(c._id.toString()));

      if (newCourses.length > 0) {
        const scoredNewCourses = scoreDocs(
          newCourses,
          ['دوره', 'استاد', 'توضیح', 'title'],
          queryTokens
        );
        courses = [...courses, ...scoredNewCourses]
          .sort((a, b) => (b.score || 0) - (a.score || 0));
      }
    }

    // --- Step 3: Format Context (Courses First) ---
    if (courses.length > 0) {
      courseContext = courses
        .slice(0, 3) // Take top 3 combined results
        .map(c =>
          [
            `دوره: ${c['دوره'] || c.title}`,
            `استاد: ${c['استاد'] || c.instructor_name || 'نامشخص'}`,
            `توضیح: ${c['توضیح'] || 'موجود نیست'}`,
            `شهریه آنلاین: ${c['شهریه آنلاین با تخفیف'] || c['شهریه آنلاین'] || '؟'}`,
            `شهریه حضوری: ${c['شهریه حضوری با تخفیف'] || c['شهریه حضوری'] || '؟'}`,
            `لینک ثبت‌نام: ${c['لینک ثبت‌نام'] || 'موجود نیست'}`,
          ].join('\n')
        )
        .join('\n\n');
    }

    if (faqs.length > 0) {
      faqContext = faqs
        .slice(0, 2) // Take top 2 FAQs as complementary
        .map(f => `سوال: ${f.question}\nپاسخ: ${f.answer}`)
        .join('\n\n');
    }

    // Combine, prioritizing courses
    const fullContext = [courseContext, faqContext]
      .filter(Boolean) // Remove empty strings
      .join('\n\n--- (اطلاعات تکمیلی) ---\n\n');

    if (fullContext.length > 0) {
      logger.info(`RAG: Context prepared (${fullContext.length} chars). Snippet: ${fullContext.substring(0, 50)}...`);
      return fullContext.substring(0, MAX_CONTEXT_CHARS);
    } else {
      logger.info('RAG: No context found.');
      return ''; // Return empty string, aiRouter will handle it
    }

  } catch (err) {
    logger.error(`❌ RAG Error: ${err.message}`);
    return ''; // Return empty on error
  }
};