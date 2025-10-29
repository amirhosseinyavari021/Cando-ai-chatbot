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
 * @param {string} dbContext - The context retrieved from RAG.
 * @returns {Promise<{text: string, raw: object}>}
 * @throws {Error} If API call fails or is not configured.
 */
export const callPrimary = async (userMessage, dbContext) => {
  if (!openai) {
    throw new Error('Primary AI (OpenAI) is not configured.');
  }

  logger.info(
    `Calling Primary AI (Responses API)... Prompt ID: ${AI_PRIMARY_PROMPT_ID}`
  );

  // --- Define variables for the Responses API ---
  // !! شما باید متغیر "db_context" را به Prompt خود در پنل OpenAI اضافه کنید !!
  const apiVariables = {
    user_message: userMessage,
  };

  if (dbContext && dbContext.trim() !== "") {
    apiVariables.db_context = dbContext;
    logger.info('Sending RAG context to Primary AI.');
  }

  try {
    const response = await openai.responses.create({
      prompt: {
        id: AI_PRIMARY_PROMPT_ID,
        version: '1', // Or whichever version you are using
        variables: apiVariables,
      },
    });

    // --- IMPORTANT ---
    // The path to the response text might differ for the "Responses API".
    // Please ADJUST this path based on the actual object shape.
    const text = response.choices?.[0]?.message?.content?.trim() || response.text?.trim();

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