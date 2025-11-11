// ecosystem.config.cjs
// ✅ Auto-load .env file so PM2 sees your API keys and MongoDB credentials
require("dotenv").config({ path: "/var/www/cando-chatbot/Cando-ai-chatbot/backend/.env" });

module.exports = {
  apps: [
    {
      name: "cando-backend",
      script: "server.js",
      cwd: "/var/www/cando-chatbot/Cando-ai-chatbot/backend",

      // این بخش از فایل .env خونده میشه
      env: {
        NODE_ENV: process.env.NODE_ENV || "production",
        PORT: process.env.PORT || 5001,
        MONGODB_URI: process.env.MONGODB_URI,
        LOG_LEVEL: process.env.LOG_LEVEL,

        // AI Configuration
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        OPENAI_API_URL: process.env.OPENAI_API_URL,
        AI_PRIMARY_MODEL: process.env.AI_PRIMARY_MODEL,
        AI_PRIMARY_PROMPT_ID: process.env.AI_PRIMARY_PROMPT_ID,

        // Fallback
        AI_FALLBACK_ENABLED: process.env.AI_FALLBACK_ENABLED,
        AI_LOCAL_MODEL_URL: process.env.AI_LOCAL_MODEL_URL,
        AI_LOCAL_MODEL_NAME: process.env.AI_LOCAL_MODEL_NAME,

        // Behavior
        AI_TIMEOUT_MS: process.env.AI_TIMEOUT_MS,
        RESTRICT_MODE: process.env.RESTRICT_MODE,
      },
    },
  ],
};
