import OpenAI from 'openai';
import aiConfig from '../../config/ai.js';
import logger from '../../middleware/logger.js';

const { OPENAI_API_KEY, OPENAI_API_URL, AI_PRIMARY_PROMPT_ID } = aiConfig;

// Ensure client is initialized only if configured
let openai;
if (OPENAI_API_KEY && AI_PRIMARY_PROMPT_ID) {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    baseURL: OPENAI_API_URL,
  });
}

/**
 * Calls the primary OpenAI model using the "Responses API".
 * @param {string} userMessage - The user's text query.
 * @returns {Promise<{text: string, raw: object}>}
 * @throws {Error} If API call fails or is not configured.
 */
export const callPrimary = async (userMessage) => {
  if (!openai) {
    throw new Error('Primary AI (OpenAI) is not configured.');
  }

  logger.info(
    `Calling Primary AI (Responses API)... Prompt ID: ${AI_PRIMARY_PROMPT_ID}`
  );

  try {
    const response = await openai.responses.create({
      prompt: {
        id: AI_PRIMARY_PROMPT_ID,
        version: '1', // Or whichever version you are using
        variables: {
          user_message: userMessage,
        },
      },
    });

    // --- IMPORTANT ---
    // The path to the response text might differ for the "Responses API".
    // Please ADJUST this path based on the actual object shape returned by
    // `openai.responses.create()`.
    // This is a common shape for Chat Completions, but maybe not Responses:
    const text = response.choices?.[0]?.message?.content?.trim();
    // A possible alternative for "Responses API" might be:
    // const text = response.text?.trim();

    if (!text) {
      logger.error(
        'Primary AI response structure unknown or empty.',
        response
      );
      throw new Error('Primary AI returned an empty or invalid response.');
    }

    logger.info('Primary AI call successful.');
    return { text, raw: response };
  } catch (error) {
    logger.error(`Primary AI (OpenAI) call failed: ${error.message}`);
    throw new Error(`Primary AI Error: ${error.message}`);
  }
};