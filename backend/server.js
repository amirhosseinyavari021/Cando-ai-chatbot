// backend/server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import { handleChat, handleChatStream, health } from "./controllers/aiController.js";

const app = express();
const PORT = parseInt(process.env.PORT || "5001", 10);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

// Routes
app.get("/api/health", health);
app.post("/api/ai/chat", handleChat);
app.post("/api/ai/chat/stream", handleChatStream);

// Start
app.listen(PORT, () => {
  console.log("🚀 Cando Chatbot backend running on port " + PORT);
  console.log("✅ Ready: POST /api/ai/chat");
  console.log("✅ Ready: POST /api/ai/chat/stream (SSE)");
});
