// frontend/src/api/ai.js
import api from './client';

export async function ask(message, userId, sessionId) {
  const { data } = await api.post('/ai/ask', { message, userId, sessionId });
  return data;
}
