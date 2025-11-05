// ============================================
// 🧠 Cando Chatbot Backend — Final
// ============================================

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import chatRouter from "./routes/chatRouter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend/.env explicitly
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5001;

// --- Basic sanity checks
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing in backend/.env");
}
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is missing in backend/.env");
}

// --- Core Middleware
app.use(cors({ origin: "*", methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }));
app.use(express.json({ limit: "10mb" }));
app.use(
  morgan("dev", {
    stream: { write: (msg) => console.info(msg.trim()) },
  })
);

// --- Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "Cando Chatbot", env: process.env.NODE_ENV || "dev" });
});

// --- API (unified)
app.use("/api", chatRouter);

// --- Legacy compat: /api/chat/stream
app.post("/api/chat/stream", (req, res, next) => {
  req.url = "/chat/stream";
  next();
}, chatRouter);

// --- 404 / Errors
app.use((req, res) => {
  res.status(404).json({ ok: false, message: "مسیر درخواستی یافت نشد." });
});

app.use((err, _req, res, _next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ ok: false, message: "خطایی در سرور رخ داد." });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (${process.env.NODE_ENV || "dev"})`);
});
