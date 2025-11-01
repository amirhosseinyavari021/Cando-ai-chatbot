module.exports = {
  apps: [
    {
      name: "cando-backend",
      script: "server.js",
      cwd: "/var/www/cando-chatbot/Cando-ai-chatbot/backend",
      env: {
        NODE_ENV: "development",
        PORT: 5001,
        OPENAI_API_KEY: "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",
        OPENROUTER_API_KEY: "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",
        DATABASE_URL: "mongodb://cando_chatbot_user:DbCanD0AY@127.0.0.1:27017/cando-ai-db?authSource=cando-ai-db",
        JWT_SECRET: "YOUR_VERY_SECURE_AND_RANDOM_SECRET_KEY",
        OLLAMA_BASE_URL: "http://localhost:11434"
      }
    }
  ]
};
