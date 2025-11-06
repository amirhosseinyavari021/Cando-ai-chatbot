// backend/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectMongo } from "./utils/mongo.js";
import { sendChat, health } from "./controllers/aiController.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

const PORT = Number(process.env.PORT || 5001);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/cando";
const RESTRICT_MODE = String(process.env.RESTRICT_MODE || "true").toLowerCase() === "true";

app.get("/api/health", health);
app.post("/api/chat/stream", sendChat);

// 404
app.use((_, res) => res.status(404).json({ ok: false, message: "Route not found" }));

// Start
(async () => {
  await connectMongo(MONGODB_URI);
  app.listen(PORT, () => {
    console.log("🧠 AI Config initialized:");
    console.log("   🔑 OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✅" : "❌");
    console.log("   🛡️  RESTRICT_MODE:", RESTRICT_MODE);
    console.log(`🚀 Server running in ${process.env.NODE_ENV || "production"} mode on port ${PORT}`);
    console.log("✅ Loaded ENV keys:", Object.keys(process.env).filter(k => ["PORT","MONGODB_URI","OPENAI_API_KEY","OPENAI_API_URL","RESTRICT_MODE"].includes(k)));
    console.log("✅ Environment preloaded:", PORT, RESTRICT_MODE);
  });
})();
