// frontend/src/api/ai.js
import api from './client';

// FIX: Renamed function and fixed payload to match backend controller
export async function getAIResponse(message, conversationId, signal) {
  const { data } = await api.post(
    '/ai/chat', // FIX: Using the route defined in aiRoutes.js
    { message, conversationId }, // FIX: Sending the payload aiController.js expects
    { signal } // Pass the signal to axios
  );
  return data;
}