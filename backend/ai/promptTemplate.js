// ESM
// backend/ai/promptTemplate.js
export function getSystemPrompt() {
  return `
You are **Cando AI Assistant**, the official academic advisor for Cando Academy.

🎯 Mission:
Answer ONLY about Cando Academy: courses, instructors, schedules, prices, policies, locations, payment methods.
Use the provided database context faithfully; NEVER invent data or go beyond academy scope.

🧠 Data sources (internal):
- MongoDB: candosite_faq, candosite_courses, candosite_teachers

💬 Language:
- Default: Persian. If user writes in English, reply in English.
- Warm, concise, friendly. 2–6 short sentences. No walls of text.

🧩 Rules:
1) Prefer FAQ if available. Else courses → instructors.
2) If unsure or data missing: briefly say you'll ask human support.
3) Do NOT mention databases, queries, RAG, or technical internals.
4) Keep answers within academy policies. Small helpful clarifications are OK but NO off-topic chat.
5) Never output code unless the user explicitly asks for it.
`;
}

// keep the developer “guard rail” small and strict
export function getDeveloperPrompt() {
  return `
- Stay on-topic: Cando Academy only.
- No external web browsing.
- If the user asks unrelated questions, reply: "من فقط درباره دوره‌ها، اساتید و اطلاعات آموزشگاه کندو می‌تونم کمک کنم 🙂"
- Keep it under ~100 words. Use bullet points only when useful. Persian by default.
`;
}

// Convert DB hits to a compact Persian context (safe length)
export function buildDbContext({ faq = [], courses = [], teachers = [] } = {}) {
  const lines = [];

  if (faq.length) {
    lines.push("🔎 FAQ:");
    for (const f of faq.slice(0, 5)) {
      lines.push(`- Q: ${safe(f.question)} | A: ${safe(f.answer)}`);
    }
  }

  if (courses.length) {
    lines.push("📚 Courses:");
    for (const c of courses.slice(0, 5)) {
      lines.push(`- ${safe(c.title || c.name || "نام دوره نامشخص")}`);
      if (c.desc) lines.push(`  شرح: ${trimLen(c.desc, 300)}`);
      if (c.instructors?.length) lines.push(`  مدرس: ${c.instructors.join("، ")}`);
      if (c.url) lines.push(`  لینک: ${c.url}`);
    }
  }

  if (teachers.length) {
    lines.push("👨‍🏫 Instructors:");
    for (const t of teachers.slice(0, 5)) {
      lines.push(`- ${safe(t.name || "نام مدرس نامشخص")}`);
      if (t.courses?.length) lines.push(`  دوره‌ها: ${t.courses.slice(0, 5).join("، ")}`);
      if (t.url) lines.push(`  لینک: ${t.url}`);
    }
  }

  // final clamp (token safety)
  const text = lines.join("\n");
  return text.slice(0, 2000);
}

export function buildMessages({ userMessage, dbContext }) {
  const system = getSystemPrompt();
  const developer = getDeveloperPrompt();

  // 极 مهم: هرگز Object خام به مدل نفرست!
  const contextBlock = dbContext ? `\n\n[DB Context]\n${dbContext}\n` : "";

  return [
    { role: "system", content: system },
    { role: "system", content: developer },
    {
      role: "user",
      content:
        `پیام کاربر:\n${userMessage}\n` +
        `${contextBlock}` +
        `\nقوانین پاسخ:\n- فارسی، کوتاه، دقیق.\n- فقط اطلاعات معتبر از کانتکست بالا.\n- اگر کافی نبود: پیشنهاد ارجاع به پشتیبانی بده.`,
    },
  ];
}

function safe(x) {
  if (!x) return "";
  if (typeof x === "string") return x.replace(/\s+/g, " ").trim();
  return String(x);
}

function trimLen(s, n) {
  if (!s) return "";
  s = safe(s);
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
