// ============================================
// 🧠 Cando Chatbot Backend — Final (with .env proof)
// ============================================

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import chatRouter from "./routes/chatRouter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load .env explicitly from backend/.env
const envPath = path.join(__dirname, ".env");
const envExists = fs.existsSync(envPath);
dotenv.config({ path: envPath });

// --- Basic sanity logs (برای دیباگ و اطمینان)
console.log("ℹ️  server.js dirname:", __dirname);
console.log("ℹ️  .env path exists?:", envExists, "→", envPath);

const app = express();
const PORT = Number(process.env.PORT || 5001);

// --- Core Middleware
app.use(cors({ origin: "*", methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev", { stream: { write: (msg) => console.info(msg.trim()) } }));

// --- Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "Cando Chatbot", env: process.env.NODE_ENV || "dev" });
});

// --- Debug ENV (برای اطمینان از لود شدن ENV زیر PM2)
app.get("/api/debug/env", (_req, res) => {
  res.json({
    cwd: process.cwd(),
    dirname: __dirname,
    env_loaded_from: envPath,
    has_env_file: envExists,
    MONGODB_URI: !!process.env.MONGODB_URI,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "***SET***" : "***MISSING***",
    MODEL: process.env.AI_PRIMARY_MODEL || null,
    NODE_ENV: process.env.NODE_ENV || null,
  });
});

// --- API
app.use("/api", chatRouter);

// --- Legacy compat: /api/chat/stream
app.post("/api/chat/stream", (req, res, next) => { req.url = "/chat/stream"; next(); }, chatRouter);

// --- 404 / Errors
app.use((req, res) => res.status(404).json({ ok: false, message: "مسیر درخواستی یافت نشد." }));
app.use((err, _req, res, _next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ ok: false, message: "خطایی در سرور رخ داد." });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (${process.env.NODE_ENV || "dev"})`);
});
