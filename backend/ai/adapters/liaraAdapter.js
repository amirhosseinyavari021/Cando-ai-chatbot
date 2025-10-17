import axios from 'axios';

// این آدرس دیگر هاردکد نیست و از متغیر محیطی خوانده می‌شود
const LIARA_API_ENDPOINT = process.env.LIARA_BASE_URL;

/**
 * Sends a text prompt to the Liara API (as a fallback).
 * @param {string} prompt - The user's query.
 * @returns {Promise<string>} The AI's response text.
 */
export const queryLiaraText = async (prompt) => {
  console.warn('Executing request to Liara Text API.');

  if (!LIARA_API_ENDPOINT || !process.env.LIARA_API_KEY) {
    console.error('Liara API URL or Key is not set in environment variables.');
    throw new Error('Liara service is not configured.');
  }

  try {
    // ارسال درخواست واقعی به اندپوینت Liara
    const response = await axios.post(
      LIARA_API_ENDPOINT,
      {
        prompt: prompt,
        // model: "chatgpt" // (اگر Liara نیاز داشت، مدل را اینجا مشخص کنید)
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.LIARA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // مسیر پاسخ بر اساس مستندات Liara ممکن است متفاوت باشد
    // این یک حدس رایج است. اگر کار نکرد، باید مستندات Liara را چک کنید.
    if (response.data && response.data.completion) {
      return response.data.completion;
    } else if (response.data && response.data.text) {
      return response.data.text;
    } else if (response.data) {
      // اگر ساختار پاسخ متفاوت است، آن را لاگ می‌گیریم
      console.log('Liara response structure:', response.data);
      // به عنوان یک راه حل موقت، کل پاسخ را برمی‌گردانیم
      return JSON.stringify(response.data);
    } else {
      throw new Error('Invalid response structure from Liara API');
    }

  } catch (error) {
    console.error('Error querying Liara Text API:', error.response ? error.response.data : error.message);
    throw new Error('Liara Text API failed');
  }
};

/**
 * Sends an image (and optional prompt) to the Liara Vision API.
 * (This logic remains a placeholder until the vision API endpoint is known)
 */
export const queryLiaraVision = async (imageUrl, prompt) => {
  console.log('Executing request to Liara Vision API (Mock).');
  await new Promise(resolve => setTimeout(resolve, 500));
  return `(Mock Response) Vision processing for "${prompt}" is not yet implemented.`;
};