import OpenAI from 'openai';
import aiConfig from '../../config/ai.js';
import logger from '../../middleware/logger.js';

const { AI_LOCAL_MODEL_URL, AI_LOCAL_MODEL_NAME } = aiConfig;

// Use a static system prompt for the local model, as requested
const LOCAL_SYSTEM_PROMPT = `You are Cando AI Assistant. Answer in Persian by default (unless user asks English). Be concise, friendly, and accurate. Use only available DB/API facts; do not fabricate. If info is missing, say you'll refer the question to a human advisor.`;

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
 * @returns {Promise<{text: string, raw: object}>}
 * @throws {Error} If API call fails or is not configured.
 */
export const callLocal = async (userMessage) => {
  if (!localOpenai) {
    throw new Error('Local Fallback AI is not configured.');
  }

  logger.info(
    `Calling Local Fallback AI... Model: ${AI_LOCAL_MODEL_NAME}`
  );

  try {
    const response = await localOpenai.chat.completions.create({
      model: AI_LOCAL_MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: LOCAL_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
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
    // Check for common connection errors
    if (error.code === 'ECONNREFUSED') {
      throw new Error(
        `Local Fallback AI connection refused at ${AI_LOCAL_MODEL_URL}. Is the service running?`
      );
    }
    throw new Error(`Local Fallback Error: ${error.message}`);
  }
};