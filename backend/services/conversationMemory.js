// A simple in-memory cache for conversation history (volatile).
// Replace with Redis or MongoDB for persistent memory.

const memoryCache = new Map();
const MAX_HISTORY = 10; // Keep last 10 messages (5 pairs)

/**
 * @param {string} conversationId
 * @returns {Promise<Array<object>>}
 */
export const getMemory = async (conversationId) => {
  return memoryCache.get(conversationId) || [];
};

/**
 * @param {string} conversationId
 * @param {object} message - { role: 'user' | 'bot', content: string }
 */
export const updateMemory = async (conversationId, message) => {
  const history = memoryCache.get(conversationId) || [];
  history.push(message);

  // Evict old messages
  if (history.length > MAX_HISTORY) {
    history.shift();
  }

  memoryCache.set(conversationId, history);
};