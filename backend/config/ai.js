// import dotenv from 'dotenv';
// dotenv.config(); // --- حذف شد: این خط باعث خطا می‌شد ---

const aiConfig = {
  // --- OpenAI Primary ---
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_API_URL: process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
  AI_PRIMARY_MODEL: process.env.AI_PRIMARY_MODEL || 'gpt-4.1',
  AI_PRIMARY_PROMPT_ID: process.env.AI_PRIMARY_PROMPT_ID,

  // --- Local Fallback ---
  AI_FALLBACK_ENABLED: process.env.AI_FALLBACK_ENABLED === 'true',
  AI_LOCAL_MODEL_URL: process.env.AI_LOCAL_MODEL_URL || 'http://localhost:11434/v1',
  AI_LOCAL_MODEL_NAME: process.env.AI_LOCAL_MODEL_NAME || 'llama3',

  // --- Behavior ---
  AI_TIMEOUT_MS: parseInt(process.env.AI_TIMEOUT_MS || '15000', 10),
};

// --- Validation ---
if (!aiConfig.OPENAI_API_KEY) {
  console.warn(
    '⚠️  WARN: OPENAI_API_KEY is not set. Primary AI will fail.'
  );
}
if (!aiConfig.AI_PRIMARY_PROMPT_ID) {
  console.warn(
    '⚠️  WARN: AI_PRIMARY_PROMPT_ID is not set. Primary AI (Responses API) will fail.'
  );
}
if (aiConfig.AI_FALLBACK_ENABLED) {
  console.log(
    `🟢 AI Fallback is ENABLED. Target: ${aiConfig.AI_LOCAL_MODEL_URL} (Model: ${aiConfig.AI_LOCAL_MODEL_NAME})`
  );
} else {
  console.log('⚪️ AI Fallback is DISABLED.');
}

export default aiConfig;