import { v4 as uuidv4 } from 'uuid';

const conversationStore = new Map();
const MAX_HISTORY_LENGTH = 20; // مطابق با فایل aiRouter شما

/**
 * تاریخچه یک مکالمه را برمی‌گرداند.
 * @param {string} conversationId - آی‌دی مکالمه
 * @returns {Promise<Array<object>>} - آرایه‌ای از پیام‌ها
 */
const getMemory = async (conversationId) => {
  if (!conversationId) {
    return [];
  }
  return conversationStore.get(conversationId) || [];
};

/**
 * یک پیام به تاریخچه مکالمه اضافه می‌کند.
 * @param {string} conversationId - آی‌دی مکالمه
 * @param {object} messageObject - { role: 'user' | 'bot' | 'assistant', content: string }
 * @returns {Promise<string>} - آی‌دی مکالمه
 */
const updateMemory = async (conversationId, messageObject) => {
  let id = conversationId || uuidv4();

  if (!conversationStore.has(id)) {
    conversationStore.set(id, []);
  }

  const history = conversationStore.get(id);
  history.push(messageObject);

  // فقط ۲۰ پیام آخر را نگه می‌داریم
  if (history.length > MAX_HISTORY_LENGTH) {
    conversationStore.set(id, history.slice(-MAX_HISTORY_LENGTH));
  } else {
    conversationStore.set(id, history);
  }

  return id;
};

/**
 * تاریخچه یک مکالمه را پاک می‌کند.
 * @param {string} conversationId - آی‌دی مکالمه
 * @returns {Promise<void>}
 */
const clearHistory = async (conversationId) => {
  if (conversationId) {
    conversationStore.delete(conversationId);
  }
};

export {
  getMemory,
  updateMemory,
  clearHistory,
};