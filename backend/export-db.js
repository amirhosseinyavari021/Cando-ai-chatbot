import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";
import { MongoClient } from "mongodb";

const MONGO_URI = "mongodb://127.0.0.1:27017";
const DB_NAME = "cando-ai-db";
const EXPORT_BASE = path.resolve("./exports");
const EXPORT_DATE = new Date().toISOString().slice(0, 10);
const EXPORT_DIR = path.join(EXPORT_BASE, EXPORT_DATE);
const EXPORT_TAR = `export_${EXPORT_DATE}.tar.gz`;

function log(msg) { console.log(msg); }
function sha256(file) { return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"); }
function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

(async () => {
  ensureDir(EXPORT_DIR);
  const client = new MongoClient(MONGO_URI);
  try {
    log("🕐 Connecting to MongoDB...");
    await client.connect();
    const db = client.db(DB_NAME);
    log("✅ Connected to MongoDB");

    const collections = [
      { name: "faq", file: "export_faq.json" },
      { name: "courses", file: "export_courses.json" },
    ];

    const manifest = { generated_at: new Date().toISOString(), collections: [] };

    for (const c of collections) {
      try {
        const docs = await db.collection(c.name).find().toArray();
        const outPath = path.join(EXPORT_DIR, c.file);
        fs.writeFileSync(outPath, JSON.stringify(docs, null, 2));
        const hash = sha256(outPath);
        manifest.collections.push({ name: c.name, count: docs.length, file: c.file, sha256: hash });
        log(`📦 Exported ${c.name} (${docs.length} docs)`);
      } catch (e) {
        log(`❌ Failed to export ${c.name}: ${e.message}`);
      }
    }

    fs.writeFileSync(path.join(EXPORT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
    fs.writeFileSync(path.join(EXPORT_DIR, "SHA256SUMS.txt"),
      manifest.collections.map(c => `${c.sha256}  ${c.file}`).join("\n")
    );
    log("🧾 Manifest and checksums created");

    try {
      execSync(`tar -czf ${EXPORT_TAR} -C ${EXPORT_BASE} ${EXPORT_DATE}`);
      log(`🗜️  Compressed to ${EXPORT_TAR}`);
    } catch {
      log("⚠️ tar not available, skipping compression");
    }
    log("✅ Done.");
  } catch (err) {
    log("❌ MongoDB connection failed:", err.message);
  } finally {
    await client.close();
  }
})();
