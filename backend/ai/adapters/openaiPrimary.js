// backend/ai/adapters/openaiPrimary.js
// This adapter handles the actual API call to OpenAI.

import OpenAI from 'openai';
import config from '../../config/ai.js';
import logger from '../../middleware/logger.js';

if (!config.OPENAI_API_KEY) {
  logger.error('❌ Missing OPENAI_API_KEY in .env');
  // We don't exit(1) here, as fallback might be enabled.
}

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
  baseURL: config.OPENAI_API_URL,
});

/**
 * Calls the primary OpenAI model with the new restricted prompt.
 * @param {string} systemMessage - The main system prompt.
 * @param {Array<object>} history - The conversation history.
 * @param {string} userMessage - The latest user message.
 * @param {string} dbContext - The RAG context from dbSearch.
 * @returns {Promise<object>} The AI's response object.
 */
export const callPrimary = async (
  systemMessage,
  history,
  userMessage,
  dbContext
) => {
  const messages = [];

  // 1. The System Prompt
  messages.push({
    role: 'system',
    content: systemMessage,
  });

  // 2. The Dynamic Context
  messages.push({
    role: 'system',
    content: `--- CONTEXT ---\n${dbContext}\n--- END CONTEXT ---`,
  });

  // 3. The History
  if (history && history.length > 0) {
    messages.push(...history);
  }

  // 4. The User's Message
  messages.push({
    role: 'user',
    content: userMessage,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: config.AI_PRIMARY_MODEL,
      messages: messages,
      temperature: 0.3, // Lower temp for more factual, less creative answers
      max_tokens: 250,
    });

    const text =
      completion.choices[0]?.message?.content ||
      'متاسفانه پاسخی دریافت نشد.';

    return {
      text: text,
      fullResponse: completion,
    };
  } catch (error) {
    logger.error(`❌ OpenAI Primary Error: ${error.message}`);
    throw new Error(`OpenAI API Error: ${error.message}`);
  }
};