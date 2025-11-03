import { v4 as uuidv4 } from 'uuid';

// این یک حافظه موقت (in-memory) ساده است.
// در محیط پروداکشن، این باید به دیتابیس یا Redis متصل شود.
const conversationStore = new Map();

const MAX_HISTORY_LENGTH = 50; // حداکثر تعداد پیام‌ها در تاریخچه

/**
 * یک پیام به تاریخچه مکالمه اضافه می‌کند.
 * @param {string | null} conversationId - آی‌دی مکالمه
 * @param {'user' | 'bot'} role - نقش فرستنده
 * @param {string | object} content - محتوای پیام
 * @returns {Promise<string>} - آی‌دی مکالمه (جدید یا موجود)
 */
const addMessage = async (conversationId, role, content) => {
  let id = conversationId || uuidv4();

  if (!conversationStore.has(id)) {
    conversationStore.set(id, []);
  }

  const history = conversationStore.get(id);
  history.push({ role, content });

  // فقط ۱۰ پیام آخر را نگه می‌داریم
  if (history.length > MAX_HISTORY_LENGTH) {
    conversationStore.set(id, history.slice(-MAX_HISTORY_LENGTH));
  } else {
    conversationStore.set(id, history);
  }

  return id;
};

/**
 * تاریخچه یک مکالمه را برمی‌گرداند.
 * @param {string} conversationId - آی‌دی مکالمه
 * @returns {Promise<Array<object>>} - آرایه‌ای از پیام‌ها
 */
const getConversationHistory = async (conversationId) => {
  if (!conversationId) {
    return [];
  }
  return conversationStore.get(conversationId) || [];
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

// توابع را با سینتکس ES Module اکسپورت می‌کنیم
export {
  addMessage,
  getConversationHistory,
  clearHistory,
};