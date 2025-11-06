import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { sendChat, health } from "./controllers/aiController.js"; // ✅ مسیر درست بدون src

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// 🩺 Health route
app.get("/api/ai/health", health);

// 🤖 Main chat route
app.post("/api/ai/chat", sendChat);

// 🪧 404 fallback
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Cando Chatbot backend running on port ${PORT}`);
  console.log("✅ Ready: POST /api/ai/chat");
});
