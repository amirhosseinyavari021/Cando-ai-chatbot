import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../../middleware/logger.js';

// ✅ بارگذاری امن .env (حتی اگر از جای دیگری import نشده باشد)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// خواندن متغیرها از process.env
const {
  OPENAI_API_KEY,
  OPENAI_API_URL = 'https://api.openai.com/v1',
  AI_PRIMARY_PROMPT_ID,
} = process.env;

let openai;

// ✅ اطمینان از مقداردهی کلید
if (OPENAI_API_KEY && AI_PRIMARY_PROMPT_ID) {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    baseURL: OPENAI_API_URL,
  });
  logger.info('✅ OpenAI client initialized successfully.');
} else {
  logger.warn('⚠️ OpenAI not initialized: missing API key or prompt ID.');
}

/**
 * Calls the primary OpenAI model using the "Responses API".
 */
export const callPrimary = async (userMessage, dbContext) => {
  if (!openai) {
    throw new Error('Primary AI (OpenAI) is not configured.');
  }

  logger.info(
    `Calling Primary AI (Responses API)... Prompt ID: ${AI_PRIMARY_PROMPT_ID}`
  );

  const apiVariables = { user_message: userMessage };

  if (dbContext && dbContext.trim() !== '') {
    apiVariables.db_context = dbContext;
    logger.info('Sending RAG context to Primary AI.');
  }

  try {
    const response = await openai.responses.create({
      prompt: {
        id: AI_PRIMARY_PROMPT_ID,
        version: '1',
        variables: apiVariables,
      },
    });

    // استخراج متن خروجی
    const text =
      response.output?.[0]?.content?.[0]?.text?.trim() ||
      response.choices?.[0]?.message?.content?.trim() ||
      response.text?.trim();

    if (!text) {
      logger.error('Primary AI returned an empty response.', response);
      throw new Error('Primary AI returned an empty or invalid response.');
    }

    logger.info('✅ Primary AI call successful.');
    return { text, raw: response };
  } catch (error) {
    logger.error(`❌ Primary AI (OpenAI) call failed: ${error.message}`);
    throw new Error(`Primary AI Error: ${error.message}`);
  }
};
