// ================== Load Environment Variables ==================
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// مسیر مطلق .env (در backend)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ================================================================

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5001,

  // --- Database ---
  MONGODB_URI: process.env.MONGODB_URI,

  // --- AI Provider ---
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_API_URL: process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
  AI_PRIMARY_MODEL: process.env.AI_PRIMARY_MODEL || 'gpt-4-turbo',
  AI_PRIMARY_PROMPT_ID: process.env.AI_PRIMARY_PROMPT_ID,

  // --- Fallback (For old mode) ---
  AI_FALLBACK_ENABLED: process.env.AI_FALLBACK_ENABLED === 'true',
  AI_LOCAL_MODEL_URL: process.env.AI_LOCAL_MODEL_URL,
  AI_LOCAL_MODEL_NAME: process.env.AI_LOCAL_MODEL_NAME,

  // --- Behavior ---
  AI_TIMEOUT_MS: parseInt(process.env.AI_TIMEOUT_MS || '15000', 10),

  // --- (DELETED) AI_RESTRICT_MODE has been removed ---
};

// Debug log
console.log('🧠 AI Config initialized:');
console.log(`   🔑 OPENAI_API_KEY: ${config.OPENAI_API_KEY ? '✅' : '❌ Missing'}`);
console.log(`   🧩 PROMPT_ID: ${config.AI_PRIMARY_PROMPT_ID ? '✅' : '❌ Missing'}`);

export default config;