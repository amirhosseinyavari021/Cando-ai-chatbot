#!/usr/bin/env node
/**
 * Cando Auto Updater v2
 * ✅ نسخه پیشرفته‌تر با ویژگی‌های:
 * - نادیده گرفتن robots.txt (خواندن تمام صفحات)
 * - دنبال کردن ریدایرکت‌ها
 * - User-Agent واقعی مرورگر (Chrome)
 * - لاگ‌گیری از صفحات خطادار در crawler.log
 * - همان ساختار خروجی (Mongo + JSON)
 */

import fs from "fs";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import crypto from "crypto";
import cron from "node-cron";
import { MongoClient } from "mongodb";
import iconv from "iconv-lite";
import chardet from "chardet";

const __dirname = path.resolve();
const OUT = path.join(__dirname, "output");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

const SEED = path.join(__dirname, "seed.json");
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set.");
  process.exit(1);
}

// ===== تنظیمات کلیدی =====
const IGNORE_ROBOTS = true; // ✅ robots.txt را نادیده بگیر
const RATE_MS = 2000; // هر ۲ ثانیه یک درخواست
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const LOG_FILE = path.join(__dirname, "crawler.log");

// ===== ابزار کمکی =====
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const nowISO = () => new Date().toISOString();
const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
  console.log(msg);
};

// ===== دریافت HTML با هندل کامل =====
async function fetchHtml(url) {
  try {
    const res = await axios.get(url, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "fa,en;q=0.9" },
      timeout: 20000,
      maxRedirects: 5,
      responseType: "arraybuffer",
      validateStatus: (s) => s < 500
    });
    if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
    const enc = chardet.detect(res.data) || "utf-8";
    return iconv.decode(res.data, enc);
  } catch (err) {
    log(`❌ Fetch error [${url}] → ${err.message}`);
    return null;
  }
}

function textOf($, sel) {
  return ($(sel).first().text() || "").trim();
}
function cleanArr(arr) {
  return [...new Set(arr.map((s) => s?.trim()).filter(Boolean))];
}
function htmlToText($el) {
  return $el.text().replace(/\s+/g, " ").trim();
}
function isFarsi(str = "") {
  return /[\u0600-\u06FF]/.test(str);
}
function normalizeTitle($) {
  return (
    $('meta[property="og:title"]').attr("content") ||
    textOf($, "h1, h1.entry-title, .page-title, .post-title") ||
    textOf($, "title")
  );
}

// ===== Parsers =====
function parseCourse($, url) {
  const title = normalizeTitle($);
  const desc =
    $('meta[name="description"]').attr("content") ||
    textOf($, ".course-excerpt, .subtitle, .lead, .entry-summary");
  const content = $("article, .entry-content, main, .content").first();
  const syllabus = cleanArr(
    $("ul, ol")
      .first()
      .find("li")
      .map((i, li) => $(li).text())
      .get()
  );
  const instructors = cleanArr(
    $('a[href*="/teacher/"], .teacher, .instructor')
      .map((i, a) => $(a).text())
      .get()
  );
  const contentHtml = content.html() || "";
  const contentText = htmlToText(content);
  return { type: "course", url, title, desc, syllabus, instructors, contentHtml, contentText };
}

function parseTeacher($, url) {
  const name = normalizeTitle($);
  const bio = htmlToText($(".teacher-bio, .entry-content, article"));
  const courses = cleanArr(
    $('a[href*="/course/"]').map((i, a) => $(a).text()).get()
  );
  return { type: "teacher", url, name, bio, courses };
}

function parseStatic($, url, type) {
  const title = normalizeTitle($);
  const content = $("article, .entry-content, main, .content").first();
  const html = content.html() || "";
  const text = htmlToText(content);
  return { type, url, title, html, text };
}

function parseFaq($, url) {
  const items = [];
  $(".faq-item, .accordion-item, .elementor-accordion-item").each((i, el) => {
    const q = $(el).find("h3, .accordion-title").first().text().trim();
    const a = $(el).find(".accordion-content, .elementor-tab-content").text().trim();
    if (q && a) items.push({ type: "faq", question: q, answer: a, sourceUrl: url });
  });
  if (!items.length) {
    $("h3, h4").each((i, h) => {
      const q = $(h).text().trim();
      const a = $(h).nextUntil("h3,h4").text().trim();
      if (q && a && a.length > 20)
        items.push({ type: "faq", question: q, answer: a, sourceUrl: url });
    });
  }
  return items;
}

// ===== MongoDB Sync =====
async function syncMongo(data) {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const collections = Object.entries(data);

  for (const [name, docs] of collections) {
    const coll = db.collection(name);
    if (!docs.length) continue;
    const ops = docs.map((d) => ({
      updateOne: {
        filter: { url: d.url },
        update: { $set: d, $setOnInsert: { createdAt: new Date() } },
        upsert: true
      }
    }));
    await coll.bulkWrite(ops, { ordered: false });
  }

  await client.close();
}

// ===== Runner =====
async function run() {
  const seed = JSON.parse(fs.readFileSync(SEED, "utf-8"));
  const buckets = {
    courses: [],
    teachers: [],
    faqs: [],
    about: [],
    contacts: [],
    payments: [],
    news: [],
    blog: []
  };

  for (const item of seed) {
    const url = item.url;
    const html = await fetchHtml(url);
    await sleep(RATE_MS);
    if (!html) continue;
    const $ = cheerio.load(html, { decodeEntities: false });
    if (!isFarsi($("body").text())) continue;

    const type = item.type || "page";
    try {
      if (type === "course") buckets.courses.push(parseCourse($, url));
      else if (type === "teacher") buckets.teachers.push(parseTeacher($, url));
      else if (type === "faq") buckets.faqs.push(...parseFaq($, url));
      else if (type === "about" || type === "contact" || type === "payment")
        buckets[`${type}s`] = [parseStatic($, url, type)];
      else if (["news", "blog"].includes(type))
        buckets[type].push(parseStatic($, url, type));
    } catch (e) {
      log(`❌ Parse error [${url}] → ${e.message}`);
    }
  }

  for (const [key, val] of Object.entries(buckets)) {
    fs.writeFileSync(
      path.join(OUT, `${key}.json`),
      JSON.stringify(val, null, 2),
      "utf-8"
    );
  }

  await syncMongo(buckets);
  log("✅ Sync finished successfully.");
}

// ===== اجرا =====
if (process.argv.includes("--cron")) {
  cron.schedule("0 3 */2 * *", () => run().catch(console.error));
  log("🕒 Scheduled every 2 days at 03:00.");
} else {
  run().catch(console.error);
}
