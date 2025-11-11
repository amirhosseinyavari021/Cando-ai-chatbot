// backend/services/kbSearch.js
async function kbSearch(db, query, limit = 8) {
  const collections = ["faqs", "courses", "candosite_courses", "roadmap"];
  const hits = [];

  for (const name of collections) {
    try {
      const col = db.collection(name);
      const rx = new RegExp(
        query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      const found = await col
        .find({
          $or: [
            { title: rx },
            { description: rx },
            { question: rx },
            { answer: rx },
            { contentText: rx },
            { desc: rx },
          ],
        })
        .limit(3)
        .toArray();
      hits.push(...found);
    } catch (e) {
      console.warn("kbSearch error:", name, e.message);
    }
  }

  return hits.slice(0, limit);
}

module.exports = { kbSearch };
