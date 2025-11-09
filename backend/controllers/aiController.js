// backend/controllers/aiController.js
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import OpenAI from "openai";

dotenv.config();

// ===== MongoDB =====
const client = new MongoClient(process.env.MONGODB_URI);
let db;
(async () => {
  try {
    await client.connect();
    db = client.db();
    console.log("✅ MongoDB connected");
  } catch (e) {
    console.error("❌ MongoDB connection error:", e);
  }
})();

// ===== OpenAI =====
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_URL || "https://api.openai.com/v1",
});

const MODEL = process.env.AI_PRIMARY_MODEL || "gpt-4o-mini";

// موضوعات مجاز (فقط کندو)
const ALLOWED = [
  "کندو",
  "آموزشگاه کندو",
  "دوره",
  "ثبت نام",
  "شهریه",
  "مدرس",
  "مسیر یادگیری",
  "CCNA",
  "Network+",
  "LPIC",
  "Linux",
  "DevOps",
  "امنیت",
  "مجازی سازی",
  "سیسکو",
  "میکروتیک",
];

function isAllowed(text = "") {
  const t = (text || "").toLowerCase();
  return ALLOWED.some((k) => t.includes(k.toLowerCase()));
}

async function kbSearch(query) {
  if (!db) return [];
  const cols = ["faqs", "courses", "candosite_courses", "roadmap"];
  const out = [];
  for (const name of cols) {
    try {
      const col = db.collection(name);
      // تلاش با text index
      const cur = col.find({ $text: { $search: query } }).limit(3);
      const arr = await cur.toArray();
      out.push(...arr);
    } catch {
      // fallback: regex
      try {
        const rx = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        const cur = col.find({ $or: [{ title: rx }, { description: rx }, { question: rx }, { answer: rx }] }).limit(3);
        const arr = await cur.toArray();
        out.push(...arr);
      } catch {}
    }
  }
  return out.slice(0, 8);
}

function buildSystemPrompt() {
  return `
شما «دستیار آموزشگاه کندو» هستید. فقط به پرسش‌های مرتبط با آموزشگاه کندو، دوره‌ها، مدرس‌ها، شهریه، ثبت‌نام و مسیرهای یادگیری پاسخ بده.
- لحن: دوستانه، مختصر ولی کامل، عامیانه‌ی محترمانه.
- خروجی را با Markdown و تیتر/لیست مرتب بده.
- اگر پرسش نامرتبط بود، با احترام بگو فقط درباره‌ی آموزشگاه کندو پاسخ می‌دی و مثال‌های مرتبط بزن.
- از معرفی یا لینک دادن به آموزشگاه‌های دیگر خودداری کن.
`.trim();
}

// ====== Standard chat (non-stream) ======
export async function handleChat(req, res) {
  try {
    const { message, sessionId = "web-session", history = [] } = req.body || {};
    if (!message || typeof message !== "string")
      return res.status(400).json({ ok: false, error: "Invalid message" });

    const allowed = isAllowed(message);
    const kbHits = allowed ? await kbSearch(message) : [];

    const context =
      kbHits.length > 0
        ? kbHits
            .map(
              (h, i) =>
                `${i + 1}. ${h.question || h.title || h.role_title || ""}\n${h.answer || h.description || h.text || ""}`
            )
            .join("\n\n")
        : "";

    const sys = buildSystemPrompt();
    const msgs = [
      { role: "system", content: sys },
      ...history.map((h) => ({ role: h.role === "assistant" ? "assistant" : "user", content: h.content })),
      {
        role: "user",
        content: `${message}\n\n${allowed ? `📚 داده‌های مرتبط:\n${context}` : ""}`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: msgs,
      temperature: 0.3,
    });

    const ai = completion.choices[0].message.content?.trim() || "…";
    res.json({ ok: true, message: ai, from: allowed ? "db+ai" : "ai", kbHits: kbHits.length });
  } catch (e) {
    console.error("❌ AI/DB ERROR:", e);
    res.status(500).json({ ok: false, error: e.message || "Internal Error" });
  }
}

// ====== Streaming chat (SSE) ======
export async function handleChatStream(req, res) {
  try {
    const { message, sessionId = "web-session", history = [] } = req.body || {};
    if (!message || typeof message !== "string")
      return res.status(400).end();

    // SSE headers
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    const allowed = isAllowed(message);
    const kbHits = allowed ? await kbSearch(message) : [];
    const context =
      kbHits.length > 0
        ? kbHits
            .map(
              (h, i) =>
                `${i + 1}. ${h.question || h.title || h.role_title || ""}\n${h.answer || h.description || h.text || ""}`
            )
            .join("\n\n")
        : "";

    const sys = buildSystemPrompt();
    const msgs = [
      { role: "system", content: sys },
      ...history.map((h) => ({ role: h.role === "assistant" ? "assistant" : "user", content: h.content })),
      {
        role: "user",
        content: `${message}\n\n${allowed ? `📚 داده‌های مرتبط:\n${context}` : ""}`,
      },
    ];

    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages: msgs,
      stream: true,
      temperature: 0.3,
    });

    let acc = "";
    for await (const part of stream) {
      const delta = part.choices?.[0]?.delta?.content || "";
      if (delta) {
        acc += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ done: true, message: acc, from: allowed ? "db+ai" : "ai", kbHits: kbHits.length })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (e) {
    console.error("❌ Stream ERROR:", e);
    try {
      res.write(`data: ${JSON.stringify({ error: "stream_error" })}\n\n`);
      res.end();
    } catch {}
  }
}

// ====== Health ======
export async function health(req, res) {
  res.json({ status: "ok", message: "Cando Chatbot backend is healthy ✅" });
}
