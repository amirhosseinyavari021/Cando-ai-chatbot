// backend/services/dbSearch.js
// This service acts as the "dbRouter" requested, finding context
// from the correct MongoDB collection based on user intent.

import Faq from '../models/Faq.js';
import Course from '../models/Course.js';
import Instructor from '../models/Instructor.js';
import { FALLBACK_NO_DATA } from '../ai/promptTemplate.js';

const MAX_CONTEXT_CHARS = 2000;

/**
 * Naive intent detection to decide which collection to search.
 * @param {string} message - The user's message.
 * @returns {'faq' | 'course' | 'instructor' | 'general'}
 */
const detectIntent = (message) => {
  const msg = message.toLowerCase();

  // Prioritize FAQ (as per prompt rules)
  if (
    msg.includes('سوال') ||
    msg.includes('چطور') ||
    msg.includes('چگونه') ||
    msg.includes('آیا') ||
    msg.includes('payment') ||
    msg.includes('پرداخت') ||
    msg.includes('آدرس') ||
    msg.includes('سیاست')
  ) {
    return 'faq';
  }

  if (
    msg.includes('course') ||
    msg.includes('دوره') ||
    msg.includes('کلاس') ||
    msg.includes('شهریه') ||
    msg.includes('ثبت‌نام') ||
    msg.includes('price')
  ) {
    return 'course';
  }

  if (
    msg.includes('instructor') ||
    msg.includes('teacher') ||
    msg.includes('استاد') ||
    msg.includes('اساتید') ||
    msg.includes('مدرس')
  ) {
    return 'instructor';
  }

  // Default to a general search
  return 'general';
};

/**
 * Truncates and formats search results into a string.
 * @param {Array<object>} results - Documents from MongoDB.
 * @param {string} title - The section title (e.g., "FAQs").
 * @returns {string}
 */
const formatResults = (results, title) => {
  if (!results || results.length === 0) return '';

  let context = `\n--- ${title} ---\n`;
  context += results
    .map((doc) => JSON.stringify(doc.toObject ? doc.toObject() : doc))
    .join('\n');
  return context;
};

/**
 * Gets context from MongoDB based on detected intent.
 * @param {string} userMessage - The user's chat message.
 * @returns {string} The formatted context string or a fallback message.
 */
export const getContextFromDB = async (userMessage) => {
  const intent = detectIntent(userMessage);
  let results = [];
  let context = '';

  try {
    // Perform a $text search on the relevant collections
    // We search all and format them to let the AI decide

    // 1. FAQ (Priority)
    const faqs = await Faq.find(
      { $text: { $search: userMessage } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(5);
    context += formatResults(faqs, 'Potential FAQs');

    // 2. Courses
    const courses = await Course.find(
      { $text: { $search: userMessage } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(3);
    context += formatResults(courses, 'Matching Courses');

    // 3. Instructors
    const instructors = await Instructor.find(
      { $text: { $search: userMessage } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(3);
    context += formatResults(instructors, 'Matching Instructors');

    // --- Check for results ---
    if (context.trim() === '') {
      // No results found in any collection
      return FALLBACK_NO_DATA;
    }

    // Truncate to stay under token limit
    if (context.length > MAX_CONTEXT_CHARS) {
      context = context.substring(0, MAX_CONTEXT_CHARS) + '... [truncated]';
    }

    return context;

  } catch (error) {
    console.error('❌ DB Search Error:', error.message);
    return FALLBACK_NO_DATA; // Return fallback on DB error
  }
};