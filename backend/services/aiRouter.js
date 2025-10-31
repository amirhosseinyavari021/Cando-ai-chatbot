// backend/services/aiRouter.js
// (REFACTORED)
import { AI_TIMEOUT_MS } from '../config/ai.js';
import { createLogEntry } from '../middleware/logger.js';
import { callPrimary } from '../ai/adapters/openaiPrimary.js';
import { callLocal } from '../ai/adapters/localFallback.js';
import logger from '../middleware/logger.js'; // Added missing logger import

// --- NEW/UPDATED Imports ---
import { getRAGContext } from './dbSearch.js';
import { getMemory, updateMemory } from './conversationMemory.js';
import { composeFinalAnswer } from './responseComposer.js';
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
 * (REMOVED getContextFromDB - Now in dbSearch.js)
 */

/**
 * Orchestrates the entire AI request lifecycle.
 * 1. Get conversation memory.
 * 2. Get RAG context.
 * 3. Try Primary AI (with timeout).
 * 4. Try Fallback AI (if primary fails).
 * 5. Format the response.
 * 6. Update memory.
 * 7. Log the interaction.
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
      getMemory(userId, 6), // Get last 6 messages from NEW memory service
      getRAGContext(userMessage), // Get context from NEW RAG service
    ]);

    // Combine history into a string for the adapters
    // The adapters are responsible for formatting the final prompt
    const historyString = history
      .map((h) => `${h.role === 'user' ? 'کاربر' : 'دستیار'}: ${h.content}`)
      .join('\n');

    // Combine history + user message for a complete prompt
    const combinedMessage =
      historyString.length > 0
        ? `${historyString}\nکاربر: ${userMessage}`
        : userMessage;

    // --- Step 3: Try Primary AI ---
    try {
      logger.info('Calling Primary AI...');
      result = await Promise.race([
        callPrimary(combinedMessage, dbContext), // Pass context to adapter
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
        // Pass the same combined message and context to the local model
        const fallbackResult = await callLocal(combinedMessage, dbContext);

        // --- Step 5 (Fallback): Format the response ---
        final = composeFinalAnswer(fallbackResult.text); // Use NEW Naturalizer

        // --- Step 6 (Fallback): Update Memory ---
        updateMemory(userId, { role: 'user', content: userMessage });
        updateMemory(userId, { role: 'assistant', content: final.text });
      } catch (fallbackError) {
        logger.error(`❌ Fallback AI also failed: ${fallbackError.message}`);
        // Re-throw the original primary error or a generic one
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