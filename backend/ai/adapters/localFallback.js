import OpenAI from 'openai';
import aiConfig from '../../config/ai.js';
import logger from '../../middleware/logger.js';

const { AI_LOCAL_MODEL_URL, AI_LOCAL_MODEL_NAME } = aiConfig;

// --- UPDATED SYSTEM PROMPT ---
// این پرامپت اکنون می‌داند که اگر اطلاعاتی به او داده شد، از آن‌ها استفاده کند
const LOCAL_SYSTEM_PROMPT = `You are Cando AI Assistant. Answer in Persian by default (unless user asks English). Be concise, friendly, and accurate.
**Rule:** If context (information) is provided below, use ONLY that context to answer the user's question.
**Rule:** If no context is provided, or the context doesn't answer the question, politely say you don't have that specific information and will refer the question to a human advisor.
**Rule:** Do not fabricate (make up) information.`;

let localOpenai;
if (AI_LOCAL_MODEL_URL && AI_LOCAL_MODEL_NAME) {
  localOpenai = new OpenAI({
    apiKey: 'ollama', // Often ignored, but required
    baseURL: AI_LOCAL_MODEL_URL,
  });
}

/**
 * Calls the local fallback LLM (Ollama, etc.) via an OpenAI-compatible API.
 * @param {string} userMessage - The user's text query.
 * @param {string} dbContext - The context retrieved from RAG.
 * @returns {Promise<{text: string, raw: object}>}
 * @throws {Error} If API call fails or is not configured.
 */
export const callLocal = async (userMessage, dbContext, options = {}) => {
  const { preferEnglish = false } = options;
  if (!localOpenai) {
    throw new Error('Local Fallback AI is not configured.');
  }

  logger.info(
    `Calling Local Fallback AI... Model: ${AI_LOCAL_MODEL_NAME}`
  );

  // --- Build messages array, including context if it exists ---
  const messages = [
    {
      role: 'system',
      content: LOCAL_SYSTEM_PROMPT,
    },
    {
      role: 'system',
      content: preferEnglish
        ? 'Respond entirely in English. Keep the tone friendly, concise, and helpful.'
        : 'پاسخ را کاملاً به فارسی و با لحنی دوستانه، صمیمی و مختصر ارائه کن.',
    },
  ];

  if (dbContext && dbContext.trim() !== "") {
    messages.push({
      role: 'system', // Add context as a second system message
      content: `Here is the context from the database:\n${dbContext}`,
    });
    logger.info('Sending RAG context to Fallback AI.');
  }

  messages.push({
    role: 'user',
    content: userMessage,
  });

  try {
    const response = await localOpenai.chat.completions.create({
      model: AI_LOCAL_MODEL_NAME,
      messages: messages,
      stream: false,
    });

    const text = response.choices?.[0]?.message?.content?.trim();

    if (!text) {
      logger.error(
        'Local Fallback AI response structure unknown or empty.',
        response
      );
      throw new Error('Local Fallback AI returned an empty response.');
    }

    logger.info('Local Fallback AI call successful.');
    return { text, raw: response };
  } catch (error) {
    logger.error(`Local Fallback AI call failed: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      throw new Error(
        `Local Fallback AI connection refused at ${AI_LOCAL_MODEL_URL}. Is the service running?`
      );
    }
    throw new Error(`Local Fallback Error: ${error.message}`);
  }
};