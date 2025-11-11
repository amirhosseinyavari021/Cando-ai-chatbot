// backend/server.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { handleChat, handleChatStream, health } from "./controllers/aiController.js";

const app = express();

// ENV و پورت — پیش‌فرض رو 5051 بگذار که با ذهنت هم‌راستا باشه
const PORT = Number(process.env.PORT || 5051);

app.use(helmet({
  contentSecurityPolicy: false, // برای SSE راحت‌تر
  crossOriginOpenerPolicy: { policy: "same-origin" },
}));
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("combined"));

// health
app.get("/health", health);

// API
app.post("/api/ai/chat", handleChat);
app.post("/api/ai/chat/stream", handleChatStream);

// 404 صریح برای /api
app.use("/api", (req, res) => res.status(404).json({ error: "not_found" }));

// شروع
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Cando Chatbot backend running on port ${PORT}`);
  console.log(`✅ Ready: POST /api/ai/chat`);
  console.log(`✅ Ready: POST /api/ai/chat/stream (SSE)`);
});
