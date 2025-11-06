module.exports = {
  apps: [
    {
      name: "cando-backend",
      script: "server.js",
      cwd: "/var/www/cando-chatbot/Cando-ai-chatbot/backend",
      env: {
        PORT: 5001,
        NODE_ENV: "production"
      },
      instances: 1,
      exec_mode: "fork",
      watch: false,
      autorestart: true,
      max_restarts: 20
    }
  ]
};
