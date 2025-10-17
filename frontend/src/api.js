import axios from 'axios';

// این برای استقرار روی Nginx آماده است
const API_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_URL,
});

export const sendChatMessage = (prompt, imageBase64 = null) => {
  return apiClient.post('/api/chat', {
    prompt,
    imageBase64, // ارسال فیلد جدید
  });
};