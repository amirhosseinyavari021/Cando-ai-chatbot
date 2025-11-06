// backend/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { sendChat, health } from "./src/controllers/aiController.js";

// ───────────────────────────────────────────────────────────────────────────────
// App
// ───────────────────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// ───────────────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT || 5001);

// Health
app.get("/api/ai/health", health);

// Canonical chat route used by the frontend
app.post("/api/ai/chat", sendChat);

// 404 JSON fallthrough
app.use((req, res) => {
  res.status(404).json({ ok: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Start
app.listen(PORT, () => {
  console.log(`🚀 Cando Chatbot backend listening on :${PORT}`);
  console.log("   → POST /api/ai/chat");
  console.log("   → GET  /api/ai/health");
});
