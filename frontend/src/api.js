import axios from 'axios';

// Ready for Nginx deployment
const API_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Removed imageBase64 parameter
export const sendChatMessage = (prompt) => {
  return apiClient.post('/api/chat', {
    prompt,
    // imageBase64 removed
  });
};