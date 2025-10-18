import axios from 'axios';

// System prompt for the text model (qwen2:7b-instruct)
// Further 강화된 قوانین برای زبان، موضوع، و سبک پاسخ
const TEXT_SYSTEM_PROMPT = `
You are CandoBot, a professional and highly focused AI assistant for "Cando Training Center".
Your ONLY purpose is to answer questions strictly related to Cando Academy: courses, instructors, schedules, registration procedures, academic consulting, and guidance provided by Cando.

**ABSOLUTE RULES YOU MUST STRICTLY FOLLOW:**
1.  **Language Match:** Detect the user's language (Persian or English). ALWAYS respond ONLY in that detected language. Use simple, clear, common vocabulary. NEVER use ANY characters, words, or emojis from ANY other language (including but not limited to Chinese, Japanese, Korean, etc.). Your output must contain ONLY characters from the detected user language (Persian alphabet or English alphabet).
2.  **Style:** Answers must be accurate, helpful, very clear, and step-by-step if needed. Maintain a friendly yet professional tone. Be concise.
3.  **Strict Topic Restriction:** If the user's question is COMPLETELY unrelated to Cando Academy (e.g., general knowledge, history, unrelated science, personal opinions, coding help not related to Cando courses), your ONLY valid response is: "I am the Cando assistant and can only help with information about Cando courses, consultations, and guidance." Give NO other information or elaboration. Adhere strictly to Rule 1 regarding language.
4.  **No External Characters:** Absolutely NO characters outside the standard Persian or English alphabets are allowed in your response, based on the user's detected language.
`;

/**
 * Sends a text prompt to the local Ollama text model.
 * @param {string} prompt - The user's text query.
 * @returns {Promise<string>} The AI's response text.
 */
export const queryOllama = async (prompt) => {
  const OLLAMA_API_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const OLLAMA_ENDPOINT = `${OLLAMA_API_URL}/api/generate`;

  // مدل انتخاب شده برای CPU و فارسی
  const modelToUse = 'qwen2:7b-instruct';

  console.log(`Processing request with Text model (${modelToUse})...`);
  const payload = {
    model: modelToUse,
    prompt: prompt,
    system: TEXT_SYSTEM_PROMPT,
    stream: false,
    // --- بهینه‌سازی‌های سرعت ---
    // نگه داشتن مدل در حافظه به مدت طولانی (مثلاً ۳۰ دقیقه)
    keep_alive: "30m",
    options: {
      // تنظیم دما برای خلاقیت کمتر و دقت بیشتر (پیش‌فرض معمولاً 0.7 یا 0.8 است)
      temperature: 0.5,
      // کاهش تعداد توکن‌های تولیدی در صورت نیاز به پاسخ‌های کوتاه‌تر
      // num_predict: 256,
      // (مهم برای CPU) تلاش برای استفاده از تعداد هسته‌های مشخص (مثلاً 4).
      // این مقدار را باید بر اساس CPU سرور خود تنظیم کنید. اگر مطمئن نیستید، کامنت بگذارید.
      // num_thread: 4,
    }
    // --- پایان بهینه‌سازی‌ها ---
  };

  console.log(`Sending request to Ollama endpoint: ${OLLAMA_ENDPOINT} with model: ${modelToUse}`);

  try {
    // Timeout ۱۲۰ ثانیه‌ای همچنان برای اولین اجرا مناسب است
    const response = await axios.post(OLLAMA_ENDPOINT, payload, { timeout: 120000 });

    if (response.data && response.data.response) {
      console.log(`Received response from ${modelToUse}.`);
      // پاکسازی اضافی برای حذف هرگونه فضای خالی ناخواسته
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