// ============================================
// 🧠 Cando Chatbot Backend (Clean Final)
// ============================================

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import logger from "./middleware/logger.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import chatRouter from "./routes/chatRouter.js";

// --- Validate ENV early (avoid silent 502) ---
const REQUIRED = ["PORT", "MONGODB_URI", "OPENAI_API_KEY"];
for (const key of REQUIRED) {
  if (!process.env[key] || String(process.env[key]).trim() === "") {
    console.error(`❌ ENV missing: ${key}`);
  }
}

// --- Connect to Database (Mongoose) ---
await connectDB();

const app = express();
const PORT = Number(process.env.PORT || 5001);

// --- Core Middleware ---
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use(
  morgan("dev", {
    stream: { write: (msg) => logger.info(msg.trim()) },
  })
);

// --- Health & Debug (for curl/Nginx upstream checks) ---
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, service: "cando-backend", ts: Date.now() })
);

app.get("/api/debug/env", (_req, res) => {
  res.json({
    ok: true,
    node: process.version,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      HAS_OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      HAS_MONGODB_URI: !!process.env.MONGODB_URI,
      RESTRICT_MODE: process.env.RESTRICT_MODE ?? "true",
      AI_PRIMARY_MODEL: process.env.AI_PRIMARY_MODEL ?? "gpt-4.1",
    },
  });
});

// --- Main API Routes ---
app.use("/api", chatRouter);

// --- Backward-compat for old frontend calls ---
app.post("/api/chat/stream", async (req, res, next) => {
  // frontend legacy endpoint hits this → chatRouter already serves /api/chat/stream.
  // keep as alias to avoid 404 during rollout.
  req.url = "/chat/stream";
  next();
}, chatRouter);

// --- 404 + Error Handlers ---
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log("🧠 AI Config initialized:");
  console.log(`   🔑 OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "✅" : "❌"}`);
  console.log(`   🛡️  RESTRICT_MODE: ${process.env.RESTRICT_MODE ?? "true"}`);
  console.log(`🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});
