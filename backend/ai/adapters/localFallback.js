// backend/ai/adapters/localFallback.js
// A stub for a fallback AI, as the focus is on the primary model.

import config from '../../config/ai.js';
import logger from '../../middleware/logger.js';

/**
 * A mock function for a local fallback.
 * @returns {Promise<object>} A standard error message.
 */
export const callLocal = async (userMessage, dbContext) => {
  logger.warn('Executing mock local fallback.');

  if (!config.AI_FALLBACK_ENABLED) {
    throw new Error('Primary AI failed and fallback is disabled.');
  }

  // Here you would normally call config.AI_LOCAL_MODEL_URL

  return {
    text: 'متاسفانه سرویس هوش مصنوعی اصلی در دسترس نیست. لطفا کمی بعد دوباره تلاش کنید.',
  };
};