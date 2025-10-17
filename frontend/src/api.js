import axios from 'axios';

// Get the backend URL from the environment variable we will set on Render
// VITE_ is a special prefix required by Vite
const API_URL = process.env.VITE_API_URL || 'http://localhost:5001';

const apiClient = axios.create({
  baseURL: API_URL,
});

export const sendChatMessage = (prompt, imageUrl = null) => {
  return apiClient.post('/api/chat', {
    prompt,
    imageUrl,
    // userId: '12345' // Later, we can add user ID from auth
  });
};

// You can add other API calls here later
// export const getFaqs = () => apiClient.get('/api/admin/faq');