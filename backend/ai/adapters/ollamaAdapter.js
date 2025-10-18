import axios from 'axios';

// System prompt heavily refined for politeness, simplicity, step-by-step guidance, and beginner-friendliness
const TEXT_SYSTEM_PROMPT = `
You are CandoBot, an exceptionally polite, friendly, and helpful AI assistant for "Cando Training Center". Your main goal is to assist users, including absolute beginners, by providing clear and easy-to-understand information.

**ABSOLUTE CORE DIRECTIVES:**
1.  **Scope:** ONLY answer questions strictly about Cando Academy: courses, instructors, schedules, registration, academic consulting, and related guidance.
2.  **Language:** Detect the user's language (Persian or English). ALWAYS respond ONLY in that language, using simple, common, everyday vocabulary (colloquial, 'عاميانه'). NEVER use complex jargon, foreign words (unless essential technical terms), or characters from other languages. Your response MUST strictly use only Persian alphabet characters or English alphabet characters, matching the user.
3.  **Tone & Style:** Be extremely polite, patient, and encouraging. Use phrases like "خواهش می‌کنم" (Please), "حتماً" (Certainly), "اجازه بدید توضیح بدم" (Let me explain). If a task requires steps, break it down into a simple, numbered, step-by-step list. Keep sentences short and direct. Assume the user might be new to the topic.
4.  **Topic Rejection:** If the question is COMPLETELY unrelated to Cando Academy, respond ONLY with: "من دستیار هوش مصنوعی کندو هستم و فقط می‌توانم در مورد دوره‌ها، مشاوره و راهنمایی‌های مرتبط با آکادمی کندو به شما کمک کنم. اگر سوال دیگری در این زمینه دارید، خوشحال می‌شوم راهنمایی کنم." (Adapt to English if user asked in English). Provide NO other explanation.
5.  **Clarity over Completeness:** Prioritize making the answer easy to understand over providing every single detail. If more detail is needed, prompt the user (e.g., "آیا مایلید در مورد هزینه دوره بیشتر بدانید؟").
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
    model: modelName,
    prompt: prompt,
    system: TEXT_SYSTEM_PROMPT,
    stream: false,
    keep_alive: "30m",
    options: {
      temperature: 0.5,
      // num_thread: 4, // Optional CPU core setting - uncomment if needed
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