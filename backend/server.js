// backend/server.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { handleChat, handleChatStream, health } from "./controllers/aiController.js";

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(cors({ origin: true, credentials: true }));
app.use(morgan("combined"));

app.get("/health", health);
app.post("/api/ai/chat", handleChat);
app.post("/api/ai/chat/stream", handleChatStream);

const PORT = process.env.PORT || 5051;
app.listen(PORT, () => {
  console.log(`🚀 Cando Chatbot backend running on port ${PORT}`);
  console.log("✅ Ready: POST /api/ai/chat");
  console.log("✅ Ready: POST /api/ai/chat/stream (SSE)");
});
