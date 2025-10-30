// backend/ai/adapters/openaiPrimary.js
import OpenAI from 'openai';
import aiConfig from '../../config/ai.js';
import logger from '../../middleware/logger.js';

const {
  OPENAI_API_KEY,
  OPENAI_API_URL = 'https://api.openai.com/v1',
  AI_PRIMARY_PROMPT_ID,
} = aiConfig;

let openai;
if (OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: OPENAI_API_KEY, baseURL: OPENAI_API_URL });
  logger.info('✅ OpenAI client initialized');
} else {
  logger.warn('⚠️ OPENAI_API_KEY missing');
}

/**
 * اگر dbContext === null باشد، یعنی باید inline تزریق شود
 * و متغیّرهای پرامپت شامل db_context ارسال نشود.
 */
export const callPrimary = async (userMessage, dbContext /* string | null */) => {
  if (!openai || !AI_PRIMARY_PROMPT_ID) {
    throw new Error('Primary AI (OpenAI) is not configured.');
  }

  const variables = { user_message: userMessage };
  const payload =
    typeof dbContext === 'string' && dbContext.trim()
      ? { prompt: { id: AI_PRIMARY_PROMPT_ID, version: '1', variables: { ...variables, db_context: dbContext } } }
      : { prompt: { id: AI_PRIMARY_PROMPT_ID, version: '1', variables } };

  try {
    const response = await openai.responses.create(payload);

    const text =
      response.output?.[0]?.content?.[0]?.text?.trim() ||
      response.choices?.[0]?.message?.content?.trim() ||
      response.text?.trim();

    if (!text) throw new Error('Empty response from primary AI');
    logger.info('✅ Primary AI ok');
    return { text, raw: response };
  } catch (e) {
    logger.error(`❌ Primary AI error: ${e.message}`);
    throw new Error(`Primary AI Error: ${e.message}`);
  }
};
