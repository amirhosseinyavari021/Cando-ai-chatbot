// backend/services/aiRouter.js
// (مسیردهی اصلاح شده)

import config from '../config/ai.js'; // مسیر صحیح (دو مرحله به بالا، سپس config)
const { AI_TIMEOUT_MS } = config;
import { createLogEntry } from '../middleware/logger.js'; // مسیر صحیح (دو مرحله به بالا، سپس middleware)
import logger from '../middleware/logger.js'; // مسیر صحیح

// --- مسیردهی اصلاح شده برای import از فولدر adapters ---
import { callPrimary } from '../ai/adapters/openaiPrimary.js';
import { callLocal } from '../ai/adapters/localFallback.js';
// ---

// --- مسیردهی اصلاح شده (نسبی) برای import از همین فولدر services ---
import { getRAGContext } from './dbSearch.js';
import { getMemory, updateMemory } from './conversationMemory.js';
import { composeFinalAnswer } from './responseFormatter.js';
// ---

/**
 * Creates a timeout promise that rejects after a specified duration.
 * @param {number} ms - Milliseconds to wait before rejecting.
 * @returns {Promise<never>}
 */
const createTimeout = (ms) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`AI Timeout: ${ms}ms`)), ms)
  );

/**
 * Orchestrates the entire AI request lifecycle.
 *
 * @param {string} userMessage - The user's incoming query.
 * @param {string} userId - The unique identifier for the user.
 * @returns {Promise<{text: string, raw: object, provider: string}>}
 */
export const routeRequest = async (userMessage, userId = 'anonymous') => {
  const start = Date.now();
  let result, provider, final;
  let primaryError = null;
  let dbContext = ''; // Ensure dbContext is in scope

  try {
    // --- Step 1 & 2: Get Memory and RAG Context (in parallel) ---
    logger.info(`🤖 Routing request for user: ${userId}`);
    const [history, retrievedDbContext] = await Promise.all([
      getMemory(userId, 6), // Get last 6 messages (3 exchanges)
      getRAGContext(userMessage), // Get context from NEW RAG service
    ]);
    dbContext = retrievedDbContext; // Assign to outer scope

    const historyString = history
      .map((h) => `${h.role === 'user' ? 'کاربر' : 'دستیار'}: ${h.content}`)
      .join('\n');

    // --- Prep Prompts for Primary (inlined) and Fallback (separate) ---
    const contextForPrimary =
      dbContext && dbContext.trim().length > 0
        ? `--- اطلاعات زمینه ---\n${dbContext}\n---\n\n`
        : '';
    const messageForPrimary = `${contextForPrimary}${historyString}\nکاربر: ${userMessage}`;

    const messageForLocal =
      historyString.length > 0
        ? `${historyString}\nکاربر: ${userMessage}`
        : userMessage;

    // --- Step 3: Try Primary AI ---
    try {
      logger.info('Calling Primary AI (with inlined context)...');
      result = await Promise.race([
        callPrimary(messageForPrimary, null),
        createTimeout(AI_TIMEOUT_MS),
      ]);
      provider = 'primary';
      logger.info('✅ Primary AI call successful.');

      final = composeFinalAnswer(result.text);

      updateMemory(userId, { role: 'user', content: userMessage });
      updateMemory(userId, { role: 'assistant', content: final.text });
    } catch (err) {
      logger.warn(`⚠️ Primary AI failed: ${err.message}`);
      primaryError = err;
      provider = 'fallback';
    }

    // --- Step 4: Try Fallback AI (if primary failed) ---
    if (provider === 'fallback') {
      try {
        logger.warn('Calling Fallback AI...');
        const fallbackResult = await callLocal(messageForLocal, dbContext);

        final = composeFinalAnswer(fallbackResult.text);

        updateMemory(userId, { role: 'user', content: userMessage });
        updateMemory(userId, { role: 'assistant', content: final.text });

        // Use provider for modelUsed if specific model isn't returned
        result = fallbackResult; // Store fallback result
      } catch (fallbackError) {
        logger.error(`❌ Fallback AI also failed: ${fallbackError.message}`);
        throw primaryError || new Error('AI service unavailable.');
      }
    }

    // --- Step 7: Log the interaction (SUCCESS LOG) ---
    // *** FIX: Added status, modelUsed, and requestType ***
    await createLogEntry({
      userId,
      prompt: userMessage,
      response: final.text,
      provider,
      latency: Date.now() - start,
      contextUsed: dbContext && dbContext.length > 0,
      // --- ADDED FIELDS ---
      status: 'success',
      modelUsed: provider, // Using 'provider' as 'modelUsed'
      requestType: 'ai_query',
    });

    return {
      text: final.text,
      raw: result,
      provider,
    };
  } catch (error) {
    logger.error(`❌ AI Routing failed: ${error.message}`);
    // --- Step 7 (Failure Log) ---
    // *** FIX: Added status, modelUsed, and requestType ***
    await createLogEntry({
      userId,
      prompt: userMessage,
      response: error.message,
      provider: 'error',
      latency: Date.now() - start,
      contextUsed: dbContext && dbContext.length > 0,
      // --- ADDED FIELDS ---
      status: 'error',
      modelUsed: provider || 'unknown',
      requestType: 'ai_query',
    });
    // Re-throw to be caught by the controller
    throw new Error(
      primaryError?.message || error.message || 'AI service unavailable.'
    );
  }
};