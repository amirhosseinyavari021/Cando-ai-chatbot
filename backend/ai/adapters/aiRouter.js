import { queryOllama } from './ollamaAdapter.js';
import { createLogEntry } from '../../middleware/logger.js';

/**
 * Routes a user's text request to the local Ollama model.
 * @param {object} options - The request options.
 * @param {string} options.prompt - The user's text prompt.
 * @param {string} [options.userId='anonymous'] - The ID of the user.
 * @returns {Promise<object>} An object with the final response and metadata.
 */
// Removed imageBase64 from parameters and logic
export const routeRequestToAI = async ({ prompt, userId = 'anonymous' }) => {
  const startTime = Date.now();
  const requestType = 'TEXT'; // Only text requests are handled now
  const modelUsed = 'QWEN2_7B'; // Indicating the specific model

  // Reject empty prompts
  if (!prompt || !prompt.trim()) {
    return { success: false, response: "Please provide a question." };
  }

  try {
    // Directly call queryOllama without image parameter
    const response = await queryOllama(prompt);

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
      // Use the error message from queryOllama if available and specific
      response: ollamaError.message.includes('took too long')
        ? ollamaError.message
        : "I'm having some technical difficulties at the moment. Please try again in a few minutes.",
      error: ollamaError.message
    };
  }
};