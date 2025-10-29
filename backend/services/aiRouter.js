import { callPrimary } from '../ai/adapters/openaiPrimary.js';
import { callLocal } from '../ai/adapters/localFallback.js';
import { createLogEntry } from '../middleware/logger.js';
import logger from '../middleware/logger.js';
import aiConfig from '../config/ai.js';

const { AI_TIMEOUT_MS, AI_FALLBACK_ENABLED, AI_PRIMARY_MODEL, AI_LOCAL_MODEL_NAME } = aiConfig;

/**
 * Creates a promise that rejects after a specified timeout.
 * @param {number} ms - Timeout duration in milliseconds.
 * @returns {Promise<never>}
 */
const createTimeout = (ms) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`AI Timeout: Request exceeded ${ms}ms`));
    }, ms);
  });
};

/**
 * Routes a user's AI request to the primary model, falling back
 * to a local model on timeout or error.
 * @param {string} userMessage - The user's query.
 * @param {string} userId - The user's ID (or 'anonymous').
 * @returns {Promise<{text: string, didFallback: boolean}>}
 */
export const routeRequest = async (userMessage, userId = 'anonymous') => {
  const startTime = Date.now();
  let primaryError = null;

  // --- Try Primary AI with Timeout ---
  try {
    logger.info(`Attempting Primary AI call... (Timeout: ${AI_TIMEOUT_MS}ms)`);
    
    const result = await Promise.race([
      callPrimary(userMessage),
      createTimeout(AI_TIMEOUT_MS),
    ]);
    
    // If successful (no timeout)
    const latency = Date.now() - startTime;
    await createLogEntry({
      userId,
      requestType: 'TEXT',
      modelUsed: AI_PRIMARY_MODEL,
      status: 'SUCCESS',
      prompt: userMessage,
      response: result.text,
      latency: latency,
    });
    return { text: result.text, didFallback: false };

  } catch (error) {
    logger.warn(`Primary AI failed or timed out: ${error.message}`);
    primaryError = error;
  }

  // --- Try Fallback AI (if enabled) ---
  if (AI_FALLBACK_ENABLED) {
    logger.info('Primary failed, attempting Fallback AI...');
    try {
      const fallbackResult = await callLocal(userMessage); // Fallback has its own internal timeout
      const latency = Date.now() - startTime;
      
      await createLogEntry({
        userId,
        requestType: 'TEXT',
        modelUsed: AI_LOCAL_MODEL_NAME,
        status: 'FALLBACK_SUCCESS',
        prompt: userMessage,
        response: fallbackResult.text,
        latency: latency,
        errorMessage: `Primary Error: ${primaryError?.message || 'N/A'}`, // Log why we fell back
      });
      return { text: fallbackResult.text, didFallback: true };

    } catch (fallbackError) {
      logger.error(`Fallback AI also failed: ${fallbackError.message}`);
      primaryError = fallbackError; // This is now the final error
    }
  }

  // --- If all else fails ---
  const latency = Date.now() - startTime;
  await createLogEntry({
    userId,
    requestType: 'TEXT',
    modelUsed: 'NONE',
    status: 'ERROR',
    prompt: userMessage,
    errorMessage: primaryError?.message || 'All AI services failed.',
    latency: latency,
  });

  throw new Error(
    primaryError?.message || 'AI services are currently unavailable.'
  );
};