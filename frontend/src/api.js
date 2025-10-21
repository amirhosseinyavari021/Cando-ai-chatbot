import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Removed useQualityModel, added cancelToken parameter
export const sendChatMessage = (prompt, cancelToken) => {
  return apiClient.post('/api/chat', {
    prompt,
    // useQualityModel removed
  }, {
    cancelToken: cancelToken // Pass the cancel token to axios
  });
};

// Removed createCancelTokenSource export (now handled in ChatBox.jsx)
// export const createCancelTokenSource = () => axios.CancelToken.source();