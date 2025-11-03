// backend/services/aiRouter.js
// (REFACTORED for better logging and memory)

import config from '../config/ai.js';
const { AI_TIMEOUT_MS } = config;
import { createLogEntry } from '../middleware/logger.js';
import logger from '../middleware/logger.js';

// --- Imports from ../ai/adapters/ ---
import { callPrimary } from '../ai/adapters/openaiPrimary.js';
import { callLocal } from '../ai/adapters/localFallback.js';

// --- Imports from ./ (services) ---
import { getContextFromDB } from './dbSearch.js';
import { getMemory, updateMemory } from './conversationMemory.js';
import { composeFinalAnswer } from './responseComposer.js';

/**
 * Creates a timeout promise that rejects after a specified duration.
 */
const createTimeout = (ms) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`AI Timeout: ${ms}ms`)), ms)
  );

/**
 * Orchestrates the entire AI request lifecycle.
 */
export const routeRequest = async (userMessage, userId = 'anonymous') => {
  const start = Date.now();
  let result, provider, final, dbContext;
  let primaryError = null;
  let didFallback = false;

  try {
    // --- Step 1 & 2: Get Memory and RAG Context ---
    logger.info(`🤖 Routing request for user: ${userId}`);
    const [history, retrievedDbContext] = await Promise.all([
      getMemory(userId), // Uses new default limit of 20
      getContextFromDB(userMessage),
    ]);
    dbContext = retrievedDbContext; // Assign to outer scope

    // Handle empty context as requested
    if (!dbContext || dbContext.trim() === "") {
      dbContext = "هیچ داده‌ای درباره این موضوع پیدا نشد.";
    }

    const historyString = history
      .map((h) => `${h.role === 'user' ? 'کاربر' : 'دستیار'}: ${h.content}`)
      .join('\n');

    // --- Prep Prompts ---
    const contextForPrimary = `--- اطلاعات زمینه ---\n${dbContext}\n---\n\n`;
    const messageForPrimary = `${contextForPrimary}${historyString}\nکاربر: ${userMessage}`;
    const messageForLocal = `${historyString}\nکاربر: ${userMessage}`;

    // --- Step 3: Try Primary AI ---
    try {
      logger.info('Calling Primary AI (with inlined context)...');
      result = await Promise.race([
        callPrimary(messageForPrimary, null), // Pass null for dbContext
        createTimeout(AI_TIMEOUT_MS),
      ]);
      provider = 'primary';
      logger.info('✅ Primary AI call successful.');
    } catch (err) {
      logger.warn(`⚠️ Primary AI failed: ${err.message}`);
      primaryError = err;
      provider = 'fallback';
      didFallback = true;
    }

    // --- Step 4: Try Fallback AI (if primary failed) ---
    if (provider === 'fallback') {
      logger.warn('Calling Fallback AI...');
      result = await callLocal(messageForLocal, dbContext);
      // 'result' (from fallback) will be used for logging
    }

    // --- Step 5: Format the response ---
    final = composeFinalAnswer(result.text);

    // --- Step 6: Update Memory ---
    updateMemory(userId, { role: 'user', content: userMessage });
    updateMemory(userId, { role: 'assistant', content: final.text });

    // --- Step 7: Log Success ---
    // (FIXED: Added all required fields)
    await createLogEntry({
      userId,
      prompt: userMessage,
      response: final.text,
      provider,
      latency: Date.now() - start,
      contextUsed: dbContext !== "هیچ داده‌ای درباره این موضوع پیدا نشد.",
      // --- New fields for schema validation ---
      status: 'success',
      modelUsed: provider,
      requestType: 'ai_query',
    });

    return {
      text: final.text,
      raw: result,
      provider,
    };

  } catch (error) {
    logger.error(`❌ AI Routing failed: ${error.message}`);

    // --- Step 7: Log Failure ---
    // (FIXED: Added all required fields for failure log)
    await createLogEntry({
      userId,
      prompt: userMessage,
      response: error.message, // Log the error message as the response
      provider: 'error',
      latency: Date.now() - start,
      contextUsed: dbContext ? (dbContext.length > 0 && dbContext !== "هیچ داده‌ای درباره این موضوع پیدا نشد.") : false,
      // --- New fields for schema validation ---
      status: 'error',
      modelUsed: provider || 'none',
      requestType: 'ai_query',
      errorMessage: error.message,
      didFallback: didFallback,
    });

    // Re-throw to be caught by the controller
    throw new Error(
      primaryError?.message || error.message || 'AI service unavailable.'
    );
  }
};
// FIX: '}' اضافه در انتهای فایل حذف شد.