import pkg from "xlsx";
import fs from "fs";
import path from "path";
const { readFile, utils } = pkg;

const SHEET = "policy";
const INPUT = "/home/aiagent/CANDO_AI_DB.xlsx";
const OUT_DIR = "/var/www/cando-chatbot/Cando-ai-chatbot/data";
const FAQ_OUT = path.join(OUT_DIR, "faq_web.json");
const COURSE_OUT = path.join(OUT_DIR, "course_notes_web.json");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const keywords = ["وب", "فرانت", "React", "HTML", "CSS", "JavaScript", "Django", "Node"];

const wb = readFile(INPUT);
const sheet = wb.Sheets[SHEET];
const rows = utils.sheet_to_json(sheet, { header: 1, defval: "" }).slice(1);

const faqs = [];
const courses = [];

for (const [q, a] of rows) {
  if (!q || !a) continue;
  const text = (q + a).toLowerCase();
  if (keywords.some(k => text.includes(k))) {
    courses.push({ title_hint: q, description: a, tags: keywords.filter(k => text.includes(k)) });
  } else {
    faqs.push({ question: q, answer: a });
  }
}

fs.writeFileSync(FAQ_OUT, JSON.stringify(faqs, null, 2));
fs.writeFileSync(COURSE_OUT, JSON.stringify(courses, null, 2));

console.log(`✅ Saved ${faqs.length} FAQ items → ${FAQ_OUT}`);
console.log(`✅ Saved ${courses.length} Course notes → ${COURSE_OUT}`);
console.log(`To import:`);
console.log(`   mongoimport --db cando_chatbot --collection faq --file ${FAQ_OUT} --jsonArray`);
