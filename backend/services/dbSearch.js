// ESM
// backend/services/dbSearch.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  // PM2/console will show this once at boot
  console.error("❌ MONGODB_URI is not set");
}
let client;

async function getDb() {
  if (!client) {
    client = new MongoClient(uri, { ignoreUndefined: true });
    await client.connect();
  }
  return client.db();
}

// simple intent classifier to choose collections
export function detectIntent(text = "") {
  const t = (text || "").toLowerCase();
  if (/(faq|سوالات متداول|سوال|پرسش)/.test(t)) return "faq";
  if (/(استاد|مدرس|teacher|instructor|اساتید)/.test(t)) return "teachers";
  if (/(course|دوره|کلاس|سرفصل|ثبت نام|شهریه|قیمت)/.test(t)) return "courses";
  // for career/path queries like "مهندس شبکه"
  if (/(مسیر|نقشه راه|شبکه|devops|دواپس|لینوکس|cisco|mikrotik)/.test(t)) return "courses";
  return "faq"; // default
}

export async function searchFaq(q, limit = 5) {
  const db = await getDb();
  const col = db.collection("candosite_faq");
  // flexible search: exact or partial
  const cursor = col
    .find({ $or: [{ question: { $regex: q, $options: "i" } }, { answer: { $regex: q, $options: "i" } }] })
    .limit(limit);
  return await cursor.toArray();
}

export async function searchCourses(q, limit = 5) {
  const db = await getDb();
  const col = db.collection("candosite_courses");
  const cursor = col
    .find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { desc: { $regex: q, $options: "i" } },
        { contentText: { $regex: q, $options: "i" } },
        { instructors: { $elemMatch: { $regex: q, $options: "i" } } },
      ],
    })
    .limit(limit);
  return await cursor.toArray();
}

export async function searchTeachers(q, limit = 5) {
  const db = await getDb();
  const col = db.collection("candosite_teachers");
  const cursor = col
    .find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { bio: { $regex: q, $options: "i" } },
        { courses: { $elemMatch: { $regex: q, $options: "i" } } },
      ],
    })
    .limit(limit);
  return await cursor.toArray();
}

export async function smartSearch(userText) {
  const intent = detectIntent(userText);
  const [faq, courses, teachers] = await Promise.all([
    intent === "faq" ? searchFaq(userText, 6) : Promise.resolve([]),
    intent === "courses" ? searchCourses(userText, 6) : Promise.resolve([]),
    intent === "teachers" ? searchTeachers(userText, 6) : Promise.resolve([]),
  ]);

  // If nothing found, broaden the net a bit for helpfulness (but still academy-only)
  if (!faq.length && !courses.length && !teachers.length) {
    const [f2, c2, t2] = await Promise.all([
      searchFaq("", 3),
      searchCourses("", 3),
      searchTeachers("", 3),
    ]);
    return { faq: f2, courses: c2, teachers: t2 };
  }

  return { faq, courses, teachers };
}
