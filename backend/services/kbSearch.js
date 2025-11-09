// backend/services/kbSearch.js
// جست‌وجوی انعطاف‌پذیر: اول $text، اگر نبود میره سراغ regex.
export async function kbSearch(db, query) {
  const collections = ["faqs", "courses", "candosite_courses", "roadmap"];
  const hits = [];

  for (const name of collections) {
    const col = db.collection(name);
    let found = [];
    try {
      found = await col.find({ $text: { $search: query } }).limit(3).toArray();
    } catch {
      // اگر text-index نیست، با regex فارسی/انگلیسی بگرد
      const rx = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      found = await col.find({ $or: [{ title: rx }, { question: rx }, { answer: rx }, { description: rx }, { contentText: rx }] }).limit(3).toArray();
    }
    hits.push(...found);
  }

  const contextText = hits
    .map((h, i) => `${i + 1}. ${h.question || h.title || h.role_title || h?.desc || h?.contentText || ""}`)
    .join("\n");

  return { hits, contextText };
}
