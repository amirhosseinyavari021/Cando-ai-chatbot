import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_URL,
});

/**
 * Sends a message to the new AI endpoint.
 * @param {string} message - The user's prompt.
 * @param {object} cancelToken - Axios cancel token.
 * @returns {Promise<object>} - The response data (e.g., { success, message, fallback })
 * @throws {Error} - Throws a custom error with a user-friendly message.
 */
export const ask = async (message, cancelToken) => {
  try {
    const response = await apiClient.post(
      '/api/ai/ask',
      { message },
      { cancelToken }
    );
    return response.data; // e.g., { success: true, message: "...", fallback: false }
  } catch (error) {
    if (axios.isCancel(error)) {
      // Don't throw an error if it was a user cancellation
      console.log('API request canceled by user.');
      // Return a special marker or just let it be caught by the hook's empty catch
      throw new Error('Cancelled'); // Throw a specific "Cancelled" error
    }

    // --- Translate errors into user-friendly messages (Section D) ---

    // 1. Network / Connection Error
    if (!error.response) {
      console.error('Network Error:', error.message);
      throw new Error('مشکلی در اتصال پیش آمد. لطفاً دوباره تلاش کنید.');
    }

    // 2. Server-side Error (AI failed, timeout, etc.)
    // The backend now sends a user-friendly 503 error message.
    if (error.response.data && error.response.data.message) {
      console.error('Server Error:', error.response.data.message);
      throw new Error(error.response.data.message);
    }

    // 3. Generic Fallback Error
    console.error('Unknown API Error:', error);
    throw new Error(
      'در حال حاضر دسترسی به سرویس هوش‌مصنوعی ممکن نیست. لطفاً کمی بعد دوباره تلاش کنید.'
    );
  }
};