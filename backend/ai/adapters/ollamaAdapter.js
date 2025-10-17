import axios from 'axios';

// سیستم پرامپت برای مدل متنی (llama3)
const TEXT_SYSTEM_PROMPT = `You are a professional, friendly assistant for "Cando Training Center". 
Your name is CandoBot.
You MUST answer questions ONLY about Cando's courses, instructors, schedules, registration processes, consultation services, and educational guidance.
If a user asks about any topic not related to Cando, you MUST refuse. Your ONLY valid response in this case is: "I’m your Cando assistant. I can only help with information about Cando courses, consultation, and guidance."
Answer in the same language as the user's question (Persian or English).`;

// سیستم پرامپت برای مدل تصویری (llava)
const VISION_SYSTEM_PROMPT = `You are an expert assistant for "Cando Training Center". 
Analyze the image provided by the user in the context of their question. 
Be concise and helpful. Only describe what you see and how it relates to Cando.`;

/**
 * Sends a prompt (and optional image) to the local Ollama service.
 * @param {string} prompt - The user's text query.
 * @param {string | null} imageBase64 - The base64 encoded image string (if any).
 * @returns {Promise<string>} The AI's response text.
 */
export const queryOllama = async (prompt, imageBase64 = null) => {
  const OLLAMA_URL = `${process.env.OLLAMA_BASE_URL}/api/generate`; // Generate endpoint is often more flexible

  let payload;

  if (imageBase64) {
    // --- حالت پردازش تصویر (Multimodal) ---
    console.log('Processing request with Multimodal model (llava)...');
    payload = {
      model: 'llava', // نام مدل چندوجهی شما (مطمئن شوید نصب است)
      prompt: prompt,
      system: VISION_SYSTEM_PROMPT,
      images: [imageBase64.split(',')[1]], // base64 خالص (بدون پیشوند data:image/...)
      stream: false,
    };
  } else {
    // --- حالت فقط متن (Text-Only) ---
    console.log('Processing request with Text model (llama3)...');
    payload = {
      model: 'llama3', // مدل متنی شما
      prompt: prompt,
      system: TEXT_SYSTEM_PROMPT,
      stream: false,
    };
  }

  try {
    const response = await axios.post(OLLAMA_URL, payload, { timeout: 45000 }); // زمان بیشتر برای پردازش تصویر

    // Ollama generate endpoint response structure is different from /api/chat
    if (response.data && response.data.response) {
      return response.data.response.trim();
    } else {
      throw new Error('Invalid response structure from Ollama API');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Ollama API unreachable. Is the service running?');
    }
    console.error('Error querying Ollama:', error.message);
    throw new Error('Failed to get response from Ollama model.');
  }
};