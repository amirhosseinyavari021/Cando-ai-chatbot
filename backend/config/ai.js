// ================== Load Environment Variables ==================
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// ================================================================

// ✅ Export config variables from process.env
export default {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5001,

  // --- Database ---
  MONGODB_URI: process.env.MONGODB_URI,

  // --- AI Primary (OpenAI) ---
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_API_URL: process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
  AI_PRIMARY_MODEL: process.env.AI_PRIMARY_MODEL || 'gpt-4.1',
  AI_PRIMARY_PROMPT_ID: process.env.AI_PRIMARY_PROMPT_ID,

  // --- AI Fallback (Local Model) ---
  AI_FALLBACK_ENABLED:
    process.env.AI_FALLBACK_ENABLED === 'true' ? true : false,
  AI_LOCAL_MODEL_URL: process.env.AI_LOCAL_MODEL_URL,
  AI_LOCAL_MODEL_NAME: process.env.AI_LOCAL_MODEL_NAME,

  // --- Behavior ---
  AI_TIMEOUT_MS: parseInt(process.env.AI_TIMEOUT_MS) || 15000,
};
