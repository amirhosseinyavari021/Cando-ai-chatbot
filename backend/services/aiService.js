// backend/services/aiService.js
import OpenAI from "openai";

const RESTRICT_MODE = String(process.env.RESTRICT_MODE || "true").toLowerCase() === "true";
const apiKey = process.env.OPENAI_API_KEY || "";

let client = null;
if (!RESTRICT_MODE && apiKey) {
  client = new OpenAI({ apiKey, baseURL: process.env.OPENAI_API_URL || undefined });
}

export async function callPrimaryAI(prompt, context = {}) {
  if (RESTRICT_MODE || !client) {
    return {
      ok: false,
      result: null,
      reason: "RESTRICTED_OR_NO_API",
    };
  }

  const sys =
    "You are Cando Assistant. Only answer with Cando Academy knowledge. If unsure, say you don't know.";

  const msgs = [
    { role: "system", content: sys },
    { role: "user", content: JSON.stringify({ question: prompt, context }) },
  ];

  const resp = await client.chat.completions.create({
    model: process.env.AI_PRIMARY_MODEL || "gpt-4o-mini",
    messages: msgs,
    temperature: 0.2,
  });

  const text = resp.choices?.[0]?.message?.content?.trim();
  return { ok: true, result: text || "" };
}
