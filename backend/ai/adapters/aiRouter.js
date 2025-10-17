import { queryOllama } from './ollamaAdapter.js'; // فقط Ollama باقی می‌ماند
import { createLogEntry } from '../../middleware/logger.js';

/**
 * Routes a user request to the local Ollama model.
 * @param {object} options - The request options.
 * @returns {Promise<object>} An object with the final response and metadata.
 */
export const routeRequestToAI = async ({ prompt, imageBase64, userId = 'anonymous' }) => {
  const startTime = Date.now();
  const requestType = imageBase64 ? 'IMAGE' : 'TEXT';
  const modelUsed = imageBase64 ? 'OLLAMA_VISION' : 'OLLAMA3';

  try {
    const response = await queryOllama(prompt, imageBase64); // ارسال هر دو

    await createLogEntry({
      userId,
      requestType,
      modelUsed: modelUsed,
      status: 'SUCCESS',
      prompt,
      response,
      latency: Date.now() - startTime
    });
    return { success: true, response, model: modelUsed };

  } catch (ollamaError) {
    console.error(`FATAL: Ollama model failed. Error: ${ollamaError.message}`);
    await createLogEntry({
      userId,
      requestType,
      modelUsed: 'NONE',
      status: 'ERROR',
      prompt,
      errorMessage: ollamaError.message,
      latency: Date.now() - startTime
    });
    return {
      success: false,
      response: "I'm having some technical difficulties at the moment. Please try again in a few minutes.",
      error: ollamaError.message
    };
  }
};