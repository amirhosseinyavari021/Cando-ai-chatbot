// backend/services/conversationMemory.js

/**
 * This is an in-memory cache for conversations.
 * It does not persist on server restart.
 *
 * Structure:
 * Map<userId, [
 * { role: 'user', content: '...', time: 12345 },
 * { role: 'assistant', content: '...', time: 12346 },
 * ]>
 */
const memory = new Map();
const MAX_HISTORY_LENGTH = 100; // Store last 100 messages as requested

/**
 * (REPLACES getHistory)
 * دریافت تاریخچه مکالمه‌ی کاربر
 * @param {string} userId - The unique identifier for the user.
 * @param {number} [limit=6] - The number of recent turns to retrieve.
 * @returns {Array<object>} - An array of message objects.
 */
export function getMemory(userId, limit = 6) {
  const history = memory.get(userId) || [];
  // Return the last 'limit' messages
  return history.slice(-limit);
}

/**
 * (REPLACES appendTurn)
 * افزودن پیام جدید به حافظه مکالمه
 * @param {string} userId - The unique identifier for the user.
 * @param {object} turn - The message object { role, content }
 */
export function updateMemory(userId, turn) {
  if (!memory.has(userId)) {
    memory.set(userId, []);
  }

  const history = memory.get(userId);
  history.push({
    role: turn.role,
    content: turn.content,
    time: Date.now(),
  });

  // Keep the history capped at the max length
  if (history.length > MAX_HISTORY_LENGTH) {
    history.shift(); // Remove the oldest message
  }

  memory.set(userId, history);
}

/**
 * (NEW)
 * پاک کردن حافظه مکالمه‌ی یک کاربر
 * @param {string} userId - The unique identifier for the user.
 */
export function clearMemory(userId) {
  if (memory.has(userId)) {
    memory.delete(userId);
    return true;
  }
  return false;
}