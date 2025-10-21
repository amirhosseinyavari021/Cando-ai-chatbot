// Use the new OpenRouter adapter
import { queryOpenRouter } from './openaiAdapter.js';
import { searchFaqs } from '../../utils/dbSearch.js';
import { createLogEntry } from '../../middleware/logger.js';
import axios from 'axios'; // Import axios for isCancel

// System Prompt remains the same (defined in openaiAdapter now, or keep here if preferred)
const SYSTEM_PROMPT = `
You are CandoBot, an exceptionally polite, friendly, patient, and helpful AI assistant for "Cando IT Academy". Your main goal is to assist ALL users, including absolute beginners, by providing extremely clear, simple, and easy-to-understand information, guiding them step-by-step.

**ABSOLUTE CORE DIRECTIVES YOU MUST OBEY AT ALL TIMES:**
1.  **Scope:** ONLY answer questions strictly about Cando Academy: courses, instructors, schedules, registration, academic consulting, and related guidance. Use the provided context FIRST if available.
2.  **Language Match:** Detect the user's language (Persian or English). ALWAYS respond ONLY in that detected language. Use extremely simple, common, everyday vocabulary. NEVER use ANY complex jargon, foreign words (unless essential like 'API'), or characters/emojis from ANY other language. Output MUST strictly use ONLY standard Persian OR English alphabet characters, matching the user.
3.  **Tone & Style:** Be extremely polite, patient, and encouraging. If a task requires steps, ALWAYS use a simple, numbered list. Explain each step clearly. Keep sentences short.
4.  **Strict Topic Rejection:** If the question is COMPLETELY unrelated to Cando Academy, EVEN IF CONTEXT IS PROVIDED, respond ONLY with: "I am the Cando assistant and can only help with information about Cando courses, consultations, and guidance." (Adapt to Persian if user asked in Persian). Provide NO other explanation.
5.  **Context Usage:** Base your answer primarily on the context provided after "Use the following information:". If the context doesn't answer the question adequately, use your general knowledge ONLY IF it relates directly to Cando Academy. If you lack information, politely state that. Do not invent information.
6.  **Clarity First:** Prioritize ease of understanding for beginners.
`;

/**
 * Routes a user's text request using RAG with OpenRouter.
 * @param {object} options - The request options.
 * @param {string} options.prompt - The user's text prompt.
 * @param {string} [options.userId='anonymous'] - The ID of the user.
 * @param {object} options.cancelTokenSource - Axios cancel token source.
 * @returns {Promise<object>} An object with the final response and metadata.
 */
export const routeRequestToAI = async ({ prompt, userId = 'anonymous', cancelTokenSource }) => {
  const startTime = Date.now();
  const requestType = 'TEXT';
  // Updated model identifier for logging
  const modelIdentifier = 'OPENROUTER_GPTOSS';

  if (!prompt || !prompt.trim()) {
    return { success: false, response: "Please provide a question." };
  }

  try {
    // --- RAG Step 1: Retrieval ---
    const context = await searchFaqs(prompt, 3); // Search DB

    // --- RAG Step 2 & 3: Augmentation & Generation ---
    console.log(`Sending prompt to OpenRouter with ${context ? 'retrieved context' : 'no context'}.`);
    // Call the updated adapter function
    const response = await queryOpenRouter(
      SYSTEM_PROMPT,
      context,
      prompt,
      cancelTokenSource ? cancelTokenSource.token : null
    );

    await createLogEntry({
      userId,
      requestType,
      modelUsed: modelIdentifier,
      status: 'SUCCESS',
      prompt,
      response,
      latency: Date.now() - startTime
    });
    return { success: true, response }; // Return only response to frontend

  } catch (error) {
    if (axios.isCancel(error)) {
      console.log("OpenRouter RAG request canceled.");
      throw error; // Re-throw cancellation
    }

    console.error(`FATAL: OpenRouter RAG pipeline failed. Error: ${error.message}`);
    await createLogEntry({
      userId,
      requestType,
      modelUsed: 'NONE',
      status: 'ERROR',
      prompt,
      errorMessage: error.message,
      latency: Date.now() - startTime
    });
    return {
      success: false,
      response: error.message || "I'm having some technical difficulties connecting to server.",
      error: error.message
    };
  }
};