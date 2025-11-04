// backend/services/aiRouter.js
// (REFACTORED for new restricted prompt and DB search)

import config from '../config/ai.js';
const { AI_TIMEOUT_MS } = config;
import logger, { createLogEntry } from '../middleware/logger.js';

// --- Imports from ../ai/adapters/ ---
import { callPrimary } from '../ai/adapters/openaiPrimary.js';
import { callLocal } from '../ai/adapters/localFallback.js';

// --- Imports from ./ (services) ---
import { getContextFromDB } from './dbSearch.js'; // <-- Using new dbSearch
import { getMemory, updateMemory } from './conversationMemory.js';
import { composeFinalAnswer } from './responseComposer.js';
import { getSystemPrompt } from '../ai/promptTemplate.js'; // <-- Import new prompt

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
  let result, provider, final, dbContext, systemMessage;
  let primaryError = null;
  let didFallback = false;

  try {
    // --- Step 1: Get System Prompt ---
    systemMessage = getSystemPrompt();

    // --- Step 2: Get Memory and RAG Context ---
    logger.info(`🤖 Routing request for user: ${userId}`);
    const [history, retrievedDbContext] = await Promise.all([
      getMemory(userId),
      getContextFromDB(userMessage), // <-- Uses new intent-based search
    ]);
    dbContext = retrievedDbContext; // Assign to outer scope

    // Note: We no longer check for empty dbContext here.
    // The new dbSearch.js returns FALLBACK_NO_DATA, which the AI is
    // instructed to use.

    // --- Step 3: Try Primary AI ---
    try {
      logger.info('Calling Primary AI (with new prompt)...');
      result = await Promise.race([
        callPrimary(systemMessage, history, userMessage, dbContext), // <-- New signature
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
      // Fallback is not context-aware in this flow
      result = await callLocal(userMessage);
    }

    // --- Step 5: Format the response ---
    final = composeFinalAnswer(result.text);

    // --- Step 6: Update Memory (Handled by controller) ---
    // updateMemory(userId, { role: 'user', content: userMessage });
    // updateMemory(userId, { role: 'assistant', content: final.text });

    // --- Step 7: Log Success ---
    await createLogEntry({
      userId,
      prompt: userMessage,
      response: final.text,
      provider,
      latency: Date.now() - start,
      contextUsed: dbContext !== "الان اطلاعاتی در این مورد توی پایگاه داده من نیست، می‌تونم از پشتیبانی بپرسم براتون.",
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
    await createLogEntry({
      userId,
      prompt: userMessage,
      response: error.message,
      provider: 'error',
      latency: Date.now() - start,
      contextUsed: !!dbContext,
      status: 'error',
      modelUsed: provider || 'none',
      requestType: 'ai_query',
      errorMessage: error.message,
      didFallback: didFallback,
    });

    throw new Error(
      primaryError?.message || error.message || 'AI service unavailable.'
    );
  }
};