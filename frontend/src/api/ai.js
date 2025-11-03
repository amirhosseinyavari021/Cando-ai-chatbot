// frontend/src/api/ai.js
import api from './client';

export async function ask(message, userId, sessionId, signal) {
  const { data } = await api.post(
    '/ai/ask',
    { message, userId, sessionId },
    { signal } // Pass the signal to axios
  );
  return data;
}