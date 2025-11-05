import OpenAI from "openai";
import mongoose from "mongoose";
import { systemPrompt } from "../ai/promptTemplate.js";

// --- OpenAI Client ---
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Helpers ---
const isEnglish = (s) => /[A-Za-z]/.test(s);
const sanitize = (s) => (s || "").replace(/\s+/g, " ").trim();

// **Policy**: فقط درباره کندو (دوره‌ها/اساتید/سیاست‌ها) جواب بده.
// سوال‌های بی‌ربط → پاسخ کوتاه و محترمانه (بدون خرج توکن زیاد).
const isOnPolicy = (q) => {
  const kw = [
    "کندو", "دوره", "دوره‌ها", "اساتید", "استاد", "ثبت نام", "شهریه",
    "تقویم", "کلاس", "گواهینامه", "پشتیبانی", "پورتال", "کلاس آنلاین",
    "Cando", "course", "instructor", "calendar", "tuition", "class"
  ];
  const hit = kw.some(k => q.includes(k));
  return hit;
};

// --- DB Query (بدون $text تا ارور ایندکس نگیری) ---
async function queryDBLoose(q) {
  const db = mongoose.connection.db;
  if (!db) return null;

  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const buckets = [
    { col: "faq", fields: ["question", "answer"] },
    { col: "faqs", fields: ["question", "answer"] },
    { col: "candosite_courses", fields: ["title", "desc", "contentText", "syllabus"] },
    { col: "candosite_blog", fields: ["title", "contentText"] },
    { col: "candosite_news", fields: ["title", "contentText"] },
    { col: "courses", fields: ["title", "description", "tags"] },
    { col: "instructors", fields: ["name", "bio", "courses"] },
    { col: "teachers", fields: ["name", "bio", "courses"] },
  ];

  const results = [];
  for (const b of buckets) {
    const or = b.fields.map((f) => ({ [f]: { $regex: rx } }));
    try {
      const arr = await db.collection(b.col).find({ $or: or }).limit(5).toArray();
      if (arr && arr.length) {
        results.push({ collection: b.col, hits: arr });
      }
    } catch (e) {
      // silently skip collection errors
    }
  }

  if (!results.length) return null;

  // ساختن کانتکست تمیز
  const ctxParts = [];
  for (const r of results) {
    for (const doc of r.hits) {
      const title = sanitize(doc.title || doc.name || doc.question || "");
      const desc = sanitize(
        (doc.answer || doc.desc || doc.contentText || doc.description || "")
      );
      if (title || desc) ctxParts.push(`• ${title}${desc ? " — " + desc : ""}`);
    }
  }

  return ctxParts.slice(0, 30).join("\n");
}

export async function handleChat(userMessageRaw) {
  const userMessage = sanitize(userMessageRaw);

  // زبان پاسخ
  const replyLang = isEnglish(userMessage) ? "en" : "fa";

  // محدودیت دامنه (on-policy)
  if (!isOnPolicy(userMessage)) {
    return replyLang === "fa"
      ? "من برای پاسخ به سوالات مربوط به آموزشگاه کندو طراحی شده‌ام (دوره‌ها، اساتید، ثبت‌نام، تقویم، شهریه و…)."
      : "I'm focused on Cando Academy only (courses, instructors, enrollment, calendar, tuition, etc.).";
  }

  // کانتکست از دیتابیس
  const dbContext = await queryDBLoose(userMessage);

  // ساخت پیام‌ها
  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...(dbContext
      ? [{ role: "system", content: `📚 Database context:\n${dbContext}` }]
      : []),
    {
      role: "user",
      content: userMessage,
    },
  ];

  // تماس با مدل
  const model = process.env.AI_PRIMARY_MODEL || "gpt-4.1";
  const completion = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.4,
  });

  let answer = completion.choices?.[0]?.message?.content?.trim();
  if (!answer) {
    answer = replyLang === "fa"
      ? "در حال حاضر پاسخی پیدا نشد. لطفاً سوال را دقیق‌تر بپرسید یا نام دوره/استاد را ذکر کنید."
      : "I couldn't find an answer. Please be more specific or mention the exact course/instructor.";
  }

  return answer;
}
