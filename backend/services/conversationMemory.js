import { v4 as uuidv4 } from 'uuid';

const conversationStore = new Map();
const MAX_HISTORY_LENGTH = 20;

/**
 * تاریخچه یک مکالمه را برمی‌گرداند.
 * @param {string} conversationId - آی‌دی مکالمه
 * @returns {Promise<Array<object>>} - آرایه‌ای از پیام‌ها
 */
// FIX: اکسپورت صحیح تابع
export const getMemory = async (conversationId) => {
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
// FIX: اکسپورت صحیح تابع
export const updateMemory = async (conversationId, messageObject) => {
  let id = conversationId || uuidv4();

  if (!conversationStore.has(id)) {
    conversationStore.set(id, []);
  }

  const history = conversationStore.get(id);
  if (messageObject.role === 'bot') {
    messageObject.role = 'assistant';
  }
  history.push(messageObject);

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
// FIX: اکسپورت صحیح تابع
export const clearHistory = async (conversationId) => {
  if (conversationId) {
    conversationStore.delete(conversationId);
  }
};