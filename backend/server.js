import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { sendChat, health } from "./src/controllers/aiController.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// 🔹 مسیر تست سلامت
app.get("/api/ai/health", health);

// 🔹 مسیر اصلی که فرانت‌اند می‌زند
app.post("/api/ai/chat", sendChat);

// 🔹 هندل 404 برای سایر مسیرها
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log("✅ POST /api/ai/chat ready");
});
