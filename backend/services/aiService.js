// ESM
// backend/services/aiService.js
import OpenAI from "openai";
import { buildDbContext, buildMessages } from "../ai/promptTemplate.js";

const {
  OPENAI_API_KEY,
  OPENAI_API_URL = "https://api.openai.com/v1",
  AI_PRIMARY_MODEL = "gpt-4.1-mini",
  AI_RESTRICT_MODE = "true",
} = process.env;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  baseURL: OPENAI_API_URL,
});

// Build final messages for the model, ensuring no raw objects leak through
export function makePrompt(userMessage, hits) {
  const dbContext = buildDbContext(hits); // → string
  return buildMessages({ userMessage, dbContext }); // → array of {role, content}
}

// Call the model safely (no streaming for now → simpler & stable)
export async function getAnswer(messages) {
  const resp = await openai.chat.completions.create({
    model: AI_PRIMARY_MODEL,
    messages,
    temperature: 0.2,
    max_tokens: 350,
  });

  const text = resp.choices?.[0]?.message?.content?.trim() || "";
  // safety clamps
  if (AI_RESTRICT_MODE === "true") {
    if (!text) {
      return "الان اطلاعات کافی ندارم؛ اگر دوست دارید دقیق‌تر بفرمایید تا راهنمایی کنم 🙂";
    }
    // forbid unrelated long rambles
    if (text.length > 900) {
      return text.slice(0, 880) + "…";
    }
  }
  return text;
}
