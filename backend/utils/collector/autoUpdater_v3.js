#!/usr/bin/env node
/**
 * Cando Auto Updater v3 – Puppeteer Edition (Fixed for Ubuntu Snap)
 * ---------------------------------------------------------------
 * ✅ استفاده از Chromium نصب‌شده در مسیر /usr/bin/chromium-browser
 * ✅ بدون نیاز به دانلود مرورگر
 * ✅ استخراج کامل صفحات JS (Bio اساتید، دوره‌ها، FAQ و ...)
 * ✅ کشف خودکار لینک‌های داخلی
 * ✅ ذخیره داده در کالکشن‌های جداگانه candosite_*
 */

import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";

// ===== تنظیمات پایه =====
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set.");
  process.exit(1);
}

const OUT = path.resolve("./output_v3");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);
const BASE = "https://cando.ac";
const RATE_MS = 1500;

// ===== تابع تاخیر =====
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ===== راه‌اندازی مرورگر (Chromium Snap) =====
async function launchBrowser() {
  return await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/chromium-browser", // مسیر صحیح برای Ubuntu Snap
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
    ],
  });
}

// ===== توابع کمکی =====
function isFarsi(str = "") {
  return /[\u0600-\u06FF]/.test(str);
}

function parseCourse($, url) {
  const title =
    $("h1").text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    $("title").text();
  const desc =
    $(".entry-summary, .course-excerpt, p").first().text().trim() ||
    $('meta[name="description"]').attr("content");
  const syllabus = $("ul li")
    .map((i, li) => $(li).text().trim())
    .get()
    .filter((x) => x.length > 3);
  const instructors = $('a[href*="/teacher/"], .teacher, .instructor')
    .map((i, a) => $(a).text().trim())
    .get();
  const contentHtml = $("main, article, .content").first().html() || "";
  const contentText = $("main, article, .content")
    .text()
    .replace(/\s+/g, " ")
    .trim();
  return {
    type: "course",
    url,
    title,
    desc,
    syllabus,
    instructors,
    contentHtml,
    contentText,
  };
}

function parseTeacher($, url) {
  const name =
    $("h1").text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    $("title").text();
  const bio = $(".entry-content, article, .teacher-bio")
    .text()
    .replace(/\s+/g, " ")
    .trim();
  const courses = $('a[href*="/course/"]')
    .map((i, a) => $(a).text().trim())
    .get();
  return { type: "teacher", url, name, bio, courses };
}

// ===== کرال کامل سایت =====
async function crawlSite() {
  const browser = await launchBrowser();
  const queue = new Set([
    `${BASE}/course/`,
    `${BASE}/teachers/`,
    `${BASE}/blog/`,
    `${BASE}/news/`,
    `${BASE}/faq/`,
    `${BASE}/about/`,
    `${BASE}/contact/`,
  ]);

  const data = {
    candosite_courses: [],
    candosite_teachers: [],
    candosite_blog: [],
    candosite_news: [],
  };

  for (const url of queue) {
    console.log(`🌐 Visiting: ${url}`);

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36"
    );

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    } catch (err) {
      console.warn(`❌ Timeout or navigation error: ${url}`);
      await page.close();
      continue;
    }

    const html = await page.content();
    const $ = cheerio.load(html);

    // کشف لینک‌های داخلی
    $('a[href^="/course/"], a[href^="/teacher/"], a[href^="/blog/"], a[href^="/news/"]').each(
      (i, a) => {
        const href = $(a).attr("href");
        if (href && href.startsWith("/")) queue.add(BASE + href);
      }
    );

    // تشخیص نوع صفحه و ذخیره
    if (/\/course\//.test(url) && !$("body").is(".archive")) {
      data.candosite_courses.push(parseCourse($, url));
    } else if (/\/teacher\//.test(url)) {
      data.candosite_teachers.push(parseTeacher($, url));
    } else if (/\/blog\//.test(url)) {
      data.candosite_blog.push(parseCourse($, url));
    } else if (/\/news\//.test(url)) {
      data.candosite_news.push(parseCourse($, url));
    }

    await page.close();
    await sleep(RATE_MS);
  }

  await browser.close();
  return data;
}

// ===== سینک به MongoDB =====
async function syncMongo(data) {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  for (const [col, docs] of Object.entries(data)) {
    if (!docs.length) continue;
    const coll = db.collection(col);
    const ops = docs.map((d) => ({
      updateOne: {
        filter: { url: d.url },
        update: { $set: d, $setOnInsert: { createdAt: new Date() } },
        upsert: true,
      },
    }));
    await coll.bulkWrite(ops, { ordered: false });
    console.log(`✅ Synced ${docs.length} docs to ${col}`);
  }

  await client.close();
}

// ===== اجرای کامل =====
async function run() {
  console.log("🚀 Starting full crawl with Puppeteer (Chromium Snap)...");
  const data = await crawlSite();
  fs.writeFileSync(
    path.join(OUT, "candosite_dump.json"),
    JSON.stringify(data, null, 2),
    "utf-8"
  );
  await syncMongo(data);
  console.log("🎯 Finished full site crawl and MongoDB sync!");
}

run().catch(console.error);
