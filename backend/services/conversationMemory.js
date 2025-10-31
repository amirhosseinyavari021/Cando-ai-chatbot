// backend/services/conversationMemory.js

const memory = new Map();

/**
 * دریافت تاریخچه مکالمه‌ی کاربر
 */
export function getHistory(userId, limit = 6) {
  const history = memory.get(userId) || [];
  return history.slice(-limit);
}

/**
 * افزودن پیام جدید به حافظه مکالمه
 */
export function appendTurn(userId, turn) {
  if (!memory.has(userId)) memory.set(userId, []);
  const h = memory.get(userId);
  h.push({ role: turn.role, content: turn.content, time: Date.now() });
  if (h.length > 10) h.shift();
  memory.set(userId, h);
}
