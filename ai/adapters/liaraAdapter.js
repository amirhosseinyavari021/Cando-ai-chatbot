import axios from 'axios';

// This is a PUBLIC endpoint. The actual secret key is handled securely below.
const LIARA_API_BASE_URL = 'https://api.liara.ir/v1'; // Example URL

/**
 * Sends a text prompt to the Liara API as a fallback.
 * (This is a mock implementation for demonstration)
 * @param {string} prompt - The user's query.
 * @returns {Promise<string>} The AI's response text.
 */
export const queryLiaraText = async (prompt) => {
  console.warn('Executing fallback to secondary AI model.');
  
  // REAL IMPLEMENTATION EXAMPLE:
  // The secret API key is read securely from environment variables and sent in the header.
  // It is NEVER hardcoded in the source file.
  /*
  try {
    const response = await axios.post(`${LIARA_API_BASE_URL}/text-completion`, 
      { prompt }, 
      { headers: { 'Authorization': `Bearer ${process.env.LIARA_API_KEY}` } }
    );
    return response.data.completion;
  } catch (error) {
    console.error('Error querying Liara Text API:', error.message);
    throw new Error('Secondary AI text model failed.');
  }
  */

  // MOCK RESPONSE (with professional, generic text):
  await new Promise(resolve => setTimeout(resolve, 500));
  return `Our primary assistant is currently experiencing high demand, but I can still help you. You asked about: "${prompt}".`;
};

/**
 * Sends an image URL to the Liara Vision API.
 * (This is a mock implementation for demonstration)
 * @param {string} imageUrl - The URL of the image.
 * @param {string} prompt - The text prompt accompanying the image.
 * @returns {Promise<string>} The AI's analysis of the image.
 */
export const queryLiaraVision = async (imageUrl, prompt) => {
  console.log('Executing request to vision model.');
  
  // MOCK RESPONSE (with professional, generic text):
  if (!imageUrl.startsWith('http')) {
    throw new Error('Invalid image URL format.');
  }
  await new Promise(resolve => setTimeout(resolve, 1000));
  return `Thank you for the image. Based on your request about "${prompt}", here is my analysis...`;
};