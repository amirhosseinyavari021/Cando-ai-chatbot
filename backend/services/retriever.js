// services/retriever.js - Clean ESM version with dotenv preload and test
import dotenv from "dotenv";
dotenv.config({ path: "/var/www/cando-chatbot/Cando-ai-chatbot/backend/.env" });

import OpenAI from "openai";
import { cosineSim } from "../utils/similarity.js";

console.log("🔧 retriever.js loaded. OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✅ Loaded" : "❌ Missing");

const apiKey = process.env.OPENAI_API_KEY;
let client = null;

if (apiKey && apiKey.startsWith("sk-")) {
  try {
    client = new OpenAI({ apiKey });
    console.log("✅ OpenAI client initialized");
  } catch (err) {
    console.error("❌ OpenAI init failed:", err.message);
  }
} else {
  console.warn("⚠️ No valid OpenAI key found, skipping client init");
}

export async function retrieveContext(query, topK = 5) {
  console.log("🔍 retrieveContext called with:", query);
  try {
    // mock data until vector DB integration
    return [
      {
        question: "مسیر یادگیری DevOps در آموزشگاه کندو چیست؟",
        answer:
          "در آموزشگاه کندو مسیر یادگیری DevOps شامل دوره‌های لینوکس، شبکه، Docker، CI/CD و Kubernetes است.",
      },
    ];
  } catch (err) {
    console.error("❌ retrieveContext error:", err);
    return [];
  }
}
