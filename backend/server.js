// ============================================
// 🧠 Cando Chatbot Backend (Final Stable Build)
// ============================================

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import chatRouter from "./routes/chatRouter.js"; // ✅ new unified chat route
import logger from "./middleware/logger.js";

// ============================================
// ⚙️ Setup
// ============================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// ============================================
// 🧩 Core Middleware
// ============================================
app.use(cors({ origin: "*", methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }));
app.use(express.json({ limit: "10mb" }));

// Request logging
app.use(
  morgan("dev", {
    stream: {
      write: (msg) => logger.info(msg.trim()),
    },
  })
);

// ============================================
// 🗄️ MongoDB Connection
// ============================================
import { MongoClient } from "mongodb";
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MONGODB_URI not found in environment");
  process.exit(1);
}
const client = new MongoClient(uri);
(async () => {
  try {
    await client.connect();
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
})();

// ============================================
// 📍 Routes
// ============================================

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true, message: "Cando Chatbot backend is healthy ✅" }));

// Main chatbot API
app.use("/api", chatRouter);

// Legacy route support (for old frontend versions)
app.post("/api/chat/stream", async (req, res, next) => {
  try {
    req.url = "/chat/stream";
    next();
  } catch (err) {
    res.status(500).json({ ok: false, error: "Internal route error" });
  }
}, chatRouter);

// ============================================
// ❌ 404 & Error Handlers
// ============================================
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "مسیر درخواستی یافت نشد.",
  });
});

app.use((err, _req, res, _next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({
    ok: false,
    message: "خطایی در سرور رخ داده است.",
  });
});

// ============================================
// 🚀 Start Server
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
