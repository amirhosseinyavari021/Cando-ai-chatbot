// ساده و سریع: جست‌وجوی regex روی سه کالکشن تولید شده توسط کرالر
// اگر اسم کالکشن‌ها متفاوت است، همین‌جا تنظیم کن.

const C_COLL = "candosite_courses";
const T_COLL = "candosite_teachers";
const F_COLL = "candosite_faq";

export async function searchAcademy(db, query) {
  const q = (query || "").toString().trim();
  if (!q) return { faqs: [], courses: [], teachers: [] };

  const rx = new RegExp(escapeRegex(q), "i");

  const [faqs, courses, teachers] = await Promise.all([
    // FAQ
    db.collection(F_COLL).find({
      $or: [{ question: rx }, { answer: rx }, { contentText: rx }]
    }).limit(5).toArray(),

    // Courses
    db.collection(C_COLL).find({
      $or: [{ title: rx }, { desc: rx }, { contentText: rx }, { instructors: rx }]
    }).limit(5).toArray(),

    // Teachers
    db.collection(T_COLL).find({
      $or: [{ name: rx }, { bio: rx }, { courses: rx }, { contentText: rx }]
    }).limit(5).toArray(),
  ]);

  // خلاصه‌سازی سبک برای پرامپت
  const faqsSlim = (faqs || []).map(f => ({
    question: f.question || f.title || "",
    answer: f.answer || f.desc || "",
  }));

  const coursesSlim = (courses || []).map(c => ({
    title: c.title || "",
    desc: c.desc || "",
  }));

  const teachersSlim = (teachers || []).map(t => ({
    name: t.name || "",
  }));

  return { faqs: faqsSlim, courses: coursesSlim, teachers: teachersSlim };
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
