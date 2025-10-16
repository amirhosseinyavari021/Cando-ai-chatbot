import { queryOllama } from './ollamaAdapter.js';
import { queryLiaraText, queryLiaraVision } from './liaraAdapter.js';
// FIX: The path to the middleware is now one level up.
import { createLogEntry } from '../middleware/logger.js';

export const routeRequestToAI = async ({ prompt, imageUrl, userId = 'anonymous' }) => {
  const startTime = Date.now();

  if (imageUrl) {
    try {
      const response = await queryLiaraVision(imageUrl, prompt);
      await createLogEntry({ userId, requestType: 'IMAGE', modelUsed: 'LIARA', status: 'SUCCESS', prompt, response, latency: Date.now() - startTime });
      return { success: true, response, model: 'LIARA' };
    } catch (error) {
      await createLogEntry({ userId, requestType: 'IMAGE', modelUsed: 'LIARA', status: 'ERROR', prompt, errorMessage: error.message, latency: Date.now() - startTime });
      return { success: false, response: "I'm currently unable to process images. Please try again with a text-only query." };
    }
  }

  try {
    const response = await queryOllama(prompt);
    await createLogEntry({ userId, requestType: 'TEXT', modelUsed: 'OLLAMA3', status: 'SUCCESS', prompt, response, latency: Date.now() - startTime });
    return { success: true, response, model: 'OLLAMA3' };
  } catch (ollamaError) {
    console.warn(`Primary model failed: ${ollamaError.message}. Attempting fallback.`);
    try {
      const response = await queryLiaraText(prompt);
      await createLogEntry({ userId, requestType: 'TEXT', modelUsed: 'LIARA', status: 'FALLBACK_SUCCESS', prompt, response, errorMessage: `Ollama Error: ${ollamaError.message}`, latency: Date.now() - startTime });
      return { success: true, response, model: 'LIARA', fallback: true };
    } catch (liaraError) {
      console.error(`FATAL: All models failed. Fallback error: ${liaraError.message}`);
      await createLogEntry({ userId, requestType: 'TEXT', modelUsed: 'NONE', status: 'ERROR', prompt, errorMessage: `Ollama: ${ollamaError.message}, Liara: ${liaraError.message}`, latency: Date.now() - startTime });
      return { success: false, response: "I'm having some technical difficulties at the moment. Please try again in a few minutes." };
    }
  }
};