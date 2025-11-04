// backend/utils/contextUtils.js

import cache from 'memory-cache';
import Faq from '../models/Faq.js';
import Course from '../models/Course.js';
import Instructor from '../models/Instructor.js';
import logger from '../middleware/logger.js';

const CACHE_DURATION_MS = 60 * 1000; // 60 seconds
const CONTEXT_MAX_LENGTH = 2000; // 2000 characters

/**
 * Tries to infer the user's intent to query a specific collection.
 * @param {string} text - The user's chat message.
 * @returns {'faq' | 'courses' | 'teachers' | null} The collection intent or null.
 */
export const detectIntent = (text) => {
  const t = text.toLowerCase();

  // Keywords for courses
  if (/\b(دوره|کلاس|course|class|bootcamp|مدرک)\b/.test(t)) {
    return 'courses';
  }

  // Keywords for instructors
  if (/\b(استاد|اساتید|مدرس|instructor|teacher|teachers)\b/.test(t)) {
    return 'teachers';
  }

  // Keywords for FAQ (general info, payment, etc.)
  if (
    /\b(سوال|چطور|چگونه|هزینه|قیمت|پرداخت|آدرس|مکان|faq|question|how|payment|price|cost|address|location|policy|کندو)\b/.test(
      t
    )
  ) {
    return 'faq';
  }

  // If no keywords match, it's likely off-topic
  return null;
};

/**
 * Searches the academic DB collections with 60-second caching.
 * @param {'faq' | 'courses' | 'teachers'} intent - The collection to search.
 * @param {string} query - The user's message (used for $text search).
 * @returns {Promise<Array<object>>} - Array of results, or empty array.
 */
export const searchAcademicDB = async (intent, query) => {
  const cacheKey = `db-search:${intent}:${query}`;
  const cachedResults = cache.get(cacheKey);

  if (cachedResults) {
    logger.info(`[Cache] HIT for intent: ${intent}`);
    return cachedResults;
  }
  logger.info(`[Cache] MISS for intent: ${intent}. Querying DB...`);

  let model;
  let projection = {}; // Select specific fields

  switch (intent) {
    case 'courses':
      model = Course;
      projection = { title: 1, short_description: 1, seo_slug: 1, price: 1, _id: 0 };
      break;
    case 'teachers':
      model = Instructor;
      projection = { name: 1, bio: 1, _id: 0 };
      break;
    case 'faq':
    default:
      model = Faq;
      projection = { question: 1, answer: 1, _id: 0 };
      break;
  }

  try {
    const results = await model
      .find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } } // Rank by relevance
      )
      .project(projection)
      .sort({ score: { $meta: 'textScore' } })
      .limit(5) // Limit to top 5 results
      .lean(); // Use .lean() for faster, plain JS objects

    // Cache the results
    cache.put(cacheKey, results, CACHE_DURATION_MS);
    return results;
  } catch (err) {
    logger.error(`Error during academic DB search (intent: ${intent}): ${err.message}`);
    return [];
  }
};

/**
 * Formats the raw DB results into a clean string for the AI context.
 * @param {Array<object>} results - The array of objects from MongoDB.
 * @returns {string} A single string of formatted context.
 */
export const formatContext = (results) => {
  if (!results || results.length === 0) {
    return "No relevant information found in the database.";
  }

  // Convert each result to a clean, compact JSON string
  return results
    .map((doc) => {
      // Clean up common Mongoose/DB artifacts if .lean() wasn't used
      const { __v, _id, score, ...cleanDoc } = doc;
      return JSON.stringify(cleanDoc);
    })
    .join('\n---\n'); // Separate documents clearly
};

/**
 * Truncates the context string to a maximum length.
 * @param {string} context - The formatted context string.
 * @returns {string} The truncated context.
 */
export const truncateContext = (context) => {
  if (context.length > CONTEXT_MAX_LENGTH) {
    return context.substring(0, CONTEXT_MAX_LENGTH) + '... [Context Truncated]';
  }
  return context;
};