// backend/scripts/ingest.js
require("dotenv").config({ path: __dirname + "/../.env" });
const { MongoClient } = require("mongodb");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_URL || "https://api.openai.com/v1",
});

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

const SOURCE_COLLECTIONS = [
  { name: "faqs", fields: ["question", "answer"] },
  { name: "courses", fields: ["title", "description", "contentText"] },
  { name: "candosite_courses", fields: ["title", "desc", "contentText"] },
  { name: "roadmap", fields: ["title", "description"] },
];

function chunkText(txt, size = 800, overlap = 150) {
  const clean = (txt || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const chunks = [];
  for (let i = 0; i < clean.length; i += (size - overlap))
    chunks.push(clean.slice(i, i + size));
  return chunks;
}

async function embedBatch(texts) {
  if (!texts || !texts.length) return [];
  const res = await openai.embeddings.create({
    model: process.env.AI_EMBED_MODEL || "text-embedding-3-small",
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

(async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();
    const kb = db.collection("kb_chunks");

    await kb.createIndex(
      { sourceCollection: 1, sourceId: 1, chunkIndex: 1 },
      { unique: true }
    );

    for (const src of SOURCE_COLLECTIONS) {
      const col = db.collection(src.name);
      const cursor = col.find({});
      let count = 0;
      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        const full = src.fields
          .map((f) => doc[f] || "")
          .filter(Boolean)
          .join(" • ");
        const chunks = chunkText(full);
        if (!chunks.length) continue;
        const embs = await embedBatch(chunks);
        const ops = chunks.map((c, i) => ({
          replaceOne: {
            filter: {
              sourceCollection: src.name,
              sourceId: doc._id,
              chunkIndex: i,
            },
            replacement: {
              sourceCollection: src.name,
              sourceId: doc._id,
              chunkIndex: i,
              content: c,
              meta: {
                title:
                  doc.title || doc.question || doc.name || src.name || "",
              },
              embedding: embs[i],
              createdAt: new Date(),
            },
            upsert: true,
          },
        }));
        await kb.bulkWrite(ops);
        count++;
      }
      console.log(`✅ Ingested ${src.name} (${count} docs)`);
    }

    await client.close();
    console.log("✅ Ingestion complete.");
  } catch (err) {
    console.error("❌ Ingest error:", err.message);
    process.exit(1);
  }
})();
