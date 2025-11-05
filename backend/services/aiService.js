import OpenAI from "openai";
import { MongoClient } from "mongodb";
import { searchAcademy } from "./dbSearch.js";

// --- ENV checks (شفاف)
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is missing in ENV");
}
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing in ENV");
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_URL || "https://api.openai.com/v1",
});

const MODEL = process.env.AI_PRIMARY_MODEL || "gpt-4.1-mini";
const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 15000);
const RESTRICT = String(process.env.AI_RESTRICT_MODE || "true").toLowerCase() === "true";

// --- Mongo connection (lazy, per call)
async function queryDB(q) {
  if (!process.env.MONGODB_URI) return null;
  const mongo = new MongoClient(process.env.MONGODB_URI);
  try {
    await mongo.connect();
    const db = mongo.db("cando-ai-db");
    const data = await searchAcademy(db, q);
    return data;
  } catch (e) {
    console.error("❌ DB error:", e.message);
    return null;
  } finally {
    try { await mongo.close(); } catch { }
  }
}

// --- Restrict: فقط کندو
function isOffTopic(text) {
  if (!RESTRICT) return false;
  const normalized = (text || "").replace(/\s+/g, " ").toLowerCase();
  // اجازه‌ی احوال‌پرسی + کلمات مرتبط با کندو
  if (/^(سلام|hi|hello|درود|خسته نباشید)\b/.test(normalized)) return false;
  const allow = ["کندو", "دوره", "اساتید", "شهریه", "ثبت نام", "زمان", "تقویم", "ui", "ux", "ccna", "devops", "لینوکس", "سیسکو", "fortinet", "میکروتیک", "دواپس", "کلاس", "آنلاین", "حضوری"];
  const intended = allow.some(k => normalized.includes(k));
  return !intended;
}

const SYSTEM_MSG = `
You are Cando AI Assistant — academic advisor for Cando Academy.
- Speak Persian by default; if user uses English, reply in English.
- Only answer about Cando Academy (courses, instructors, schedules, prices, policies).
- Use provided database context when available; never invent facts.
- Be brief (2–5 sentences), friendly, and helpful.
- If info not found, say you'll refer to human support.
- Do not mention databases, RAG, or sources in the reply.
`;

export async function handleChat(userMessage) {
  if (isOffTopic(userMessage)) {
    return "من فقط درباره‌ی دوره‌ها، اساتید و اطلاعات آموزشگاه کندو می‌تونم کمک کنم 🙂";
  }

  const dbContext = await queryDB(userMessage); // { faqs, courses, teachers } | null

  const userContent = [
    dbContext ? `📚 Database context (summarized):
- FAQs: ${dbContext.faqs?.slice(0, 3).map(f => f.question).join(" | ") || "—"}
- Courses: ${dbContext.courses?.slice(0, 3).map(c => c.title).join(" | ") || "—"}
- Teachers: ${dbContext.teachers?.slice(0, 3).map(t => t.name).join(" | ") || "—"}` : "",
    `👤 User: ${userMessage}`
  ].filter(Boolean).join("\n\n");

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const resp = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_MSG },
        { role: "user", content: userContent }
      ],
      temperature: 0.2,
      max_tokens: 350,
    }, { signal: controller.signal });

    clearTimeout(id);
    const text = resp?.choices?.[0]?.message?.content?.trim();
    return text || "متوجه نشدم؛ لطفاً دقیق‌تر بفرمایید درباره کدام دوره/استاد می‌پرسید.";
  } catch (err) {
    clearTimeout(id);
    console.error("❌ AI error:", err?.message || err);
    if (dbContext && (dbContext.faqs?.length || dbContext.courses?.length || dbContext.teachers?.length)) {
      return "فعلاً به سرویس هوش مصنوعی دسترسی ندارم. اما می‌تونم بگم: " +
        (dbContext.courses?.[0]?.title ? `مثلاً دوره «${dbContext.courses[0].title}» در کندو ارائه میشه.` : "اطلاعاتی از پایگاه داده دارم.") +
        " اگر مورد خاصی مد نظرتونه بفرمایید تا دقیق‌تر راهنمایی کنم.";
    }
    return "الان نمی‌تونم پاسخ کامل بدم. لطفاً کمی بعد دوباره امتحان کنید یا با پشتیبانی کندو تماس بگیرید.";
  }
}
