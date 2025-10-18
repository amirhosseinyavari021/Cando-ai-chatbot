import { queryOllama } from './ollamaAdapter.js';
import { createLogEntry } from '../../middleware/logger.js';

// Define the models - FAST_MODEL updated
const FAST_MODEL = 'Qwen2.5:3B'; // Updated default fast model
const QUALITY_MODEL = 'qwen2:7b-instruct'; // Quality model remains the same

/**
 * Routes a user's text request to the appropriate Ollama model.
 * Defaults to the fast model unless useQualityModel is true.
 * @param {object} options - The request options.
 * @param {string} options.prompt - The user's text prompt.
 * @param {boolean} [options.useQualityModel=false] - Flag to use the higher quality model.
 * @param {string} [options.userId='anonymous'] - The ID of the user.
 * @returns {Promise<object>} An object with the final response and metadata.
 */
export const routeRequestToAI = async ({ prompt, useQualityModel = false, userId = 'anonymous' }) => {
  const startTime = Date.now();
  const requestType = 'TEXT';

  if (!prompt || !prompt.trim()) {
    return { success: false, response: "Please provide a question." };
  }

  // --- Select Model Based on Flag ---
  const modelToUse = useQualityModel ? QUALITY_MODEL : FAST_MODEL;
  // Updated logging identifier for the new fast model
  const modelIdentifier = useQualityModel ? 'QWEN2_7B' : 'QWEN2.5_3B';
  // --- End Model Selection ---

  console.log(`Routing request to model: ${modelToUse}`);
  try {
    // Call queryOllama with the selected model name
    const response = await queryOllama(prompt, modelToUse);

    await createLogEntry({
      userId,
      requestType,
      modelUsed: modelIdentifier, // Use consistent identifier for logging
      status: 'SUCCESS',
      prompt,
      response,
      latency: Date.now() - startTime
    });
    // Add which model was used in the response payload for the frontend
    return { success: true, response, model: modelIdentifier, requestedQuality: useQualityModel };

  } catch (ollamaError) {
    console.error(`FATAL: Ollama model (${modelToUse}) failed. Error: ${ollamaError.message}`);
    await createLogEntry({
      userId,
      requestType,
      modelUsed: 'NONE',
      status: 'ERROR',
      prompt,
      errorMessage: `Model ${modelToUse}: ${ollamaError.message}`,
      latency: Date.now() - startTime
    });
    return {
      success: false,
      response: ollamaError.message.includes('took too long') || ollamaError.message.includes('unreachable')
        ? ollamaError.message
        : "I'm having some technical difficulties at the moment. Please try again in a few minutes.",
      error: ollamaError.message
    };
  }
};