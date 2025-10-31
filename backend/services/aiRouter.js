// backend/ai/adapters/aiRouter.js
// (This file is MOVED from services/ and refactored)

import config from '../../config/ai.js';
const { AI_TIMEOUT_MS } = config;
import { createLogEntry } from '../../middleware/logger.js';
import { callPrimary } from './openaiPrimary.js';
import { callLocal } from './localFallback.js';
import logger from '../../middleware/logger.js';

// --- NEW/UPDATED Imports from 'services' directory ---
import { getRAGContext } from '../services/dbSearch.js';
import { getMemory, updateMemory } from '../services/conversationMemory.js';
import { composeFinalAnswer } from '../services/responseFormatter.js';
// --- End NEW ---

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

  try {
    // --- Step 1 & 2: Get Memory and RAG Context (in parallel) ---
    logger.info(`🤖 Routing request for user: ${userId}`);
    const [history, dbContext] = await Promise.all([
      getMemory(userId, 6), // Get last 6 messages (3 exchanges)
      getRAGContext(userMessage), // Get context from NEW RAG service
    ]);

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
        // Pass 'null' for dbContext to prevent sending 'prompt_variables'
        callPrimary(messageForPrimary, null),
        createTimeout(AI_TIMEOUT_MS),
      ]);
      provider = 'primary';
      logger.info('✅ Primary AI call successful.');

      // --- Step 5: Format the response ---
      final = composeFinalAnswer(result.text); // Use NEW Naturalizer

      // --- Step 6: Update Memory ---
      updateMemory(userId, { role: 'user', content: userMessage });
      updateMemory(userId, { role: 'assistant', content: final.text });
    } catch (err) {
      logger.warn(`⚠️ Primary AI failed: ${err.message}`);
      primaryError = err;
      provider = 'fallback'; // Set provider to fallback
    }

    // --- Step 4: Try Fallback AI (if primary failed) ---
    if (provider === 'fallback') {
      try {
        logger.warn('Calling Fallback AI...');
        // Pass the original message and separate context to the local model
        const fallbackResult = await callLocal(messageForLocal, dbContext);

        // --- Step 5 (Fallback): Format the response ---
        final = composeFinalAnswer(fallbackResult.text); // Use Naturalizer

        // --- Step 6 (Fallback): Update Memory ---
        updateMemory(userId, { role: 'user', content: userMessage });
        updateMemory(userId, { role: 'assistant', content: final.text });
      } catch (fallbackError) {
        logger.error(`❌ Fallback AI also failed: ${fallbackError.message}`);
        throw primaryError || new Error('AI service unavailable.');
      }
    }

    // --- Step 7: Log the interaction ---
    await createLogEntry({
      userId,
      prompt: userMessage,
      response: final.text,
      provider,
      latency: Date.now() - start,
      contextUsed: dbContext && dbContext.length > 0,
    });

    return {
      text: final.text,
      raw: result, // 'result' might be undefined if primary failed, which is ok
      provider,
    };
  } catch (error) {
    logger.error(`❌ AI Routing failed: ${error.message}`);
    // Log the failure
    await createLogEntry({
      userId,
      prompt: userMessage,
      response: error.message,
      provider: 'error',
      latency: Date.now() - start,
      contextUsed: false,
    });
    // Re-throw to be caught by the controller
    throw new Error(
      primaryError?.message || error.message || 'AI service unavailable.'
    );
  }
};