import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Added useQualityModel parameter and cancelToken
export const sendChatMessage = (prompt, useQualityModel = false, cancelToken) => {
  return apiClient.post('/api/chat', {
    prompt,
    useQualityModel, // Send the flag to the backend
  }, {
    cancelToken: cancelToken
  });
};

export const createCancelTokenSource = () => axios.CancelToken.source();