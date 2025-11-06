// backend/services/dbSearch.js
import { getDB } from "../utils/mongo.js";

/**
 * جستجوی معنایی/کلمه‌ای ساده روی کالکشن‌های موجود.
 * اولویت با FAQs است؛ بعد Courses. اگر ایندکس متنی داری، خودش استفاده می‌کند.
 */
export async function semanticSearch(userQuery, limit = 1) {
  const db = getDB();
  const q = (userQuery || "").trim();
  if (!q) return [];

  // سعی می‌کنیم از $text استفاده کنیم؛ اگر ایندکس نبود، fallback به RegExp
  const tryText = async (collection, project = {}) => {
    try {
      return await db
        .collection(collection)
        .find({ $text: { $search: q } }, { projection: { score: { $meta: "textScore" }, ...project } })
        .sort({ score: { $meta: "textScore" } })
        .limit(limit)
        .toArray();
    } catch {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      return await db
        .collection(collection)
        .find({ $or: [{ question: rx }, { answer: rx }, { title: rx }, { description: rx }, { content: rx }, { name: rx }] }, { projection: project })
        .limit(limit)
        .toArray();
    }
  };

  // 1) FAQs
  let hits = await tryText("faqs", { question: 1, answer: 1 });
  if (hits?.length) {
    return hits.map((d) => ({
      source: "faqs",
      text: d.answer || d.response || "",
      question: d.question || "",
      score: d.score || 1,
    }));
  }

  // 2) Courses
  hits = await tryText("courses", { title: 1, description: 1, syllabus: 1 });
  if (hits?.length) {
    return hits.map((d) => ({
      source: "courses",
      text:
        d.description ||
        (Array.isArray(d.syllabus) ? d.syllabus.join(" • ") : d.syllabus) ||
        d.title ||
        "",
      question: d.title || "",
      score: d.score || 1,
    }));
  }

  return [];
}
