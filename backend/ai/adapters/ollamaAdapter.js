import axios from 'axios';

// System prompt for the text model (qwen2:7b-instruct)
// Reinforcing rules for language, topic, and style
const TEXT_SYSTEM_PROMPT = `
You are CandoBot, a professional and highly focused AI assistant for "Cando Training Center".
Your ONLY purpose is to answer questions strictly related to Cando Academy: courses, instructors, schedules, registration procedures, academic consulting, and guidance provided by Cando.

**ABSOLUTE RULES YOU MUST FOLLOW:**
1.  **Language Match:** Detect the user's language (Persian or English). ALWAYS respond ONLY in that detected language. Use simple, clear, common vocabulary. NEVER use any other language or characters.
2.  **Style:** Answers must be accurate, helpful, very clear, and step-by-step if needed. Maintain a friendly yet professional tone. Be concise.
3.  **Strict Topic Restriction:** If the user's question is COMPLETELY unrelated to Cando Academy (e.g., general knowledge, history, unrelated science, personal opinions, coding help not related to Cando courses), your ONLY valid response is: "I am the Cando assistant and can only help with information about Cando courses, consultations, and guidance." Give NO other information or elaboration.
4.  **No External Languages/Characters:** Do not include any words, characters, or emojis from languages other than the user's detected language (Persian or English).
`;

/**
 * Sends a text prompt to the local Ollama text model.
 * @param {string} prompt - The user's text query.
 * @returns {Promise<string>} The AI's response text.
 */
// Removed imageBase64 parameter
export const queryOllama = async (prompt) => {
  // Use default Ollama URL if not set in environment variables
  const OLLAMA_API_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const OLLAMA_ENDPOINT = `${OLLAMA_API_URL}/api/generate`;

  const modelToUse = 'qwen2:7b-instruct'; // Using the new specified model

  console.log(`Processing request with Text model (${modelToUse})...`);
  const payload = {
    model: modelToUse,
    prompt: prompt,
    system: TEXT_SYSTEM_PROMPT,
    stream: false,
    // options: { // Optional: Adjust parameters if needed for qwen2
    //   temperature: 0.7,
    // }
  };

  console.log(`Sending request to Ollama endpoint: ${OLLAMA_ENDPOINT} with model: ${modelToUse}`);

  try {
    // Keeping the increased timeout as CPU processing can still be slow
    const response = await axios.post(OLLAMA_ENDPOINT, payload, { timeout: 120000 });

    if (response.data && response.data.response) {
      console.log(`Received response from ${modelToUse}.`);
      return response.data.response.trim();
    } else {
      console.error('Invalid response structure from Ollama API:', response.data);
      throw new Error('Invalid response structure from Ollama API');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error(`Ollama API unreachable at ${OLLAMA_API_URL}. Is the service running?`);
      throw new Error(`Ollama API unreachable at ${OLLAMA_API_URL}. Is the service running?`);
    } else if (error.code === 'ETIMEDOUT' || (error.message && error.message.includes('timeout'))) {
      const timeoutDuration = error.config && error.config.timeout ? error.config.timeout : 'N/A';
      console.error(`Ollama model (${modelToUse}) timed out after ${timeoutDuration}ms.`);
      throw new Error(`The AI model (${modelToUse}) took too long to respond. Please try again.`);
    } else {
      const errorDetails = error.response ? error.response.data : error.message;
      console.error(`Error querying Ollama (${modelToUse}):`, errorDetails);
      throw new Error('Failed to get response from Ollama model.');
    }
  }
};