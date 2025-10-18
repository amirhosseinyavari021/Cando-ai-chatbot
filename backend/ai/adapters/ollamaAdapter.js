import axios from 'axios';

// System prompt remains the same
const TEXT_SYSTEM_PROMPT = `
You are CandoBot, a professional and highly focused AI assistant for "Cando Training Center".
Your ONLY purpose is to answer questions strictly related to Cando Academy: courses, instructors, schedules, registration procedures, academic consulting, and guidance provided by Cando.

**ABSOLUTE RULES YOU MUST STRICTLY FOLLOW:**
1.  **Language Match:** Detect the user's language (Persian or English). ALWAYS respond ONLY in that detected language. Use simple, clear, common vocabulary. NEVER use ANY characters, words, or emojis from ANY other language. Your output must contain ONLY characters from the detected user language (Persian alphabet or English alphabet).
2.  **Style:** Answers must be accurate, helpful, very clear, and step-by-step if needed. Maintain a friendly yet professional tone. Be concise, especially if you are the faster model.
3.  **Strict Topic Restriction:** If the user's question is COMPLETELY unrelated to Cando Academy, your ONLY valid response is: "I am the Cando assistant and can only help with information about Cando courses, consultations, and guidance." Give NO other information or elaboration. Adhere strictly to Rule 1 regarding language.
4.  **No External Characters:** Absolutely NO characters outside the standard Persian or English alphabets are allowed in your response, based on the user's detected language.
`;

/**
 * Sends a text prompt to a specified local Ollama text model.
 * @param {string} prompt - The user's text query.
 * @param {string} modelName - The name of the Ollama model to use.
 * @returns {Promise<string>} The AI's response text.
 */
export const queryOllama = async (prompt, modelName) => {
  const OLLAMA_API_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const OLLAMA_ENDPOINT = `${OLLAMA_API_URL}/api/generate`;

  console.log(`Processing request with Text model (${modelName})...`);
  const payload = {
    model: modelName, // Uses the model name passed from aiRouter
    prompt: prompt,
    system: TEXT_SYSTEM_PROMPT,
    stream: false,
    keep_alive: "30m",
    options: {
      temperature: 0.5,
      // num_thread: 4, // Optional
    }
  };

  console.log(`Sending request to Ollama endpoint: ${OLLAMA_ENDPOINT} with model: ${modelName}`);

  try {
    const response = await axios.post(OLLAMA_ENDPOINT, payload, { timeout: 120000 });

    if (response.data && response.data.response) {
      console.log(`Received response from ${modelName}.`);
      return response.data.response.trim();
    } else {
      console.error(`Invalid response structure from Ollama API (${modelName}):`, response.data);
      throw new Error('Invalid response structure from Ollama API');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error(`Ollama API unreachable at ${OLLAMA_API_URL}. Is the service running?`);
      throw new Error(`Ollama API unreachable at ${OLLAMA_API_URL}. Is the service running?`);
    } else if (error.code === 'ETIMEDOUT' || (error.message && error.message.includes('timeout'))) {
      const timeoutDuration = error.config?.timeout ?? 'N/A';
      console.error(`Ollama model (${modelName}) timed out after ${timeoutDuration}ms.`);
      throw new Error(`The AI model (${modelName}) seems to be taking too long or is unavailable. Please try again shortly.`);
    } else {
      const errorDetails = error.response ? error.response.data : error.message;
      console.error(`Error querying Ollama (${modelName}):`, errorDetails);
      throw new Error(`Failed to get response from Ollama model (${modelName}).`);
    }
  }
};