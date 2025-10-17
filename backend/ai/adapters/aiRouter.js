import { queryOllama } from './ollamaAdapter.js';
import { queryLiaraText, queryLiaraVision } from './liaraAdapter.js';
import { createLogEntry } from '../../middleware/logger.js';

/**
 * Routes a user request to the appropriate AI model, handles fallbacks, and logs the outcome.
 * @param {object} options - The request options.
 * @returns {Promise<object>} An object with the final response and metadata.
 */
export const routeRequestToAI = async ({ prompt, imageUrl, userId = 'anonymous' }) => {
  const startTime = Date.now();

  // 1. Image Processing Route (Unchanged)
  if (imageUrl) {
    // ... (منطق پردازش تصویر اینجا)
    try {
      const response = await queryLiaraVision(imageUrl, prompt);
      await createLogEntry({ userId, requestType: 'IMAGE', modelUsed: 'LIARA', status: 'SUCCESS', prompt: `${prompt} [Image: ${imageUrl}]`, response, latency: Date.now() - startTime });
      return { success: true, response, model: 'LIARA' };
    } catch (error) {
      await createLogEntry({ userId, requestType: 'IMAGE', modelUsed: 'LIARA', status: 'ERROR', prompt: `${prompt} [Image: ${imageUrl}]`, errorMessage: error.message, latency: Date.now() - startTime });
      return { success: false, response: "I'm currently unable to process images. Please try again with a text-only query." };
    }
  }

  // --- START OF MODIFICATION ---
  // 2. Text Processing Route (Forcing Liara as primary)
  console.log('Routing text request directly to Liara (Ollama bypassed).');
  try {
    const response = await queryLiaraText(prompt);
    await createLogEntry({
      userId,
      requestType: 'TEXT',
      modelUsed: 'LIARA',
      status: 'SUCCESS',
      prompt,
      response,
      latency: Date.now() - startTime
    });
    return { success: true, response, model: 'LIARA', fallback: false };
  } catch (liaraError) {
    console.error(`FATAL: Liara failed. Error: ${liaraError.message}`);
    await createLogEntry({
      userId,
      requestType: 'TEXT',
      modelUsed: 'NONE',
      status: 'ERROR',
      prompt,
      errorMessage: `Liara Error: ${liaraError.message}`,
      latency: Date.now() - startTime
    });
    return {
      success: false,
      response: "I'm having some technical difficulties at the moment. Please try again in a few minutes.",
      error: liaraError.message
    };
  }
  // --- END OF MODIFICATION ---
};