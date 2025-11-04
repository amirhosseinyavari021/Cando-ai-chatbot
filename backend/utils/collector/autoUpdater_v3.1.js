#!/usr/bin/env node
/**
 * Cando Auto Updater v3.1 – Full Deep Crawl Edition
 * --------------------------------------------------
 * 🚀 ویژگی‌ها:
 * - رندر کامل صفحات با Puppeteer (JS + Elementor)
 * - کشف تمام لینک‌های داخلی از صفحات دسته‌بندی (course/blog/news)
 * - استخراج محتوای کامل (title, desc, syllabus, instructors, bio, text)
 * - ذخیره در کالکشن‌های جدید candosite_*
 * - قابل اجرا روی سرور Ubuntu (Chromium Snap)
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

const OUT = path.resolve("./output_v3_1");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);
const BASE = "https://cando.ac";
const RATE_MS = 1200;

// ===== تابع تاخیر =====
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ===== راه‌اندازی مرورگر =====
async function launchBrowser() {
  return await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/chromium-browser", // مخصوص Ubuntu Snap
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

function cleanText(t) {
  return (t || "").replace(/\s+/g, " ").trim();
}

function parseCourse($, url) {
  const title =
    cleanText($("h1").text()) ||
    $('meta[property="og:title"]').attr("content") ||
    cleanText($("title").text());
  const desc =
    cleanText($(".entry-summary, .course-excerpt, p").first().text()) ||
    $('meta[name="description"]').attr("content");
  const syllabus = $("ul li")
    .map((i, li) => cleanText($(li).text()))
    .get()
    .filter((x) => x.length > 3);
  const instructors = $('a[href*="/teacher/"], .teacher, .instructor')
    .map((i, a) => cleanText($(a).text()))
    .get();
  const contentHtml = $("main, article, .content").first().html() || "";
  const contentText = cleanText($("main, article, .content").text());
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
    cleanText($("h1").text()) ||
    $('meta[property="og:title"]').attr("content") ||
    cleanText($("title").text());
  const bio = cleanText($(".entry-content, article, .teacher-bio").text());
  const courses = $('a[href*="/course/"]')
    .map((i, a) => cleanText($(a).text()))
    .get();
  return { type: "teacher", url, name, bio, courses };
}

// ===== کرال کامل سایت =====
async function crawlSite() {
  const browser = await launchBrowser();
  const visited = new Set();
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
    candosite_faq: [],
  };

  for (const url of queue) {
    if (visited.has(url)) continue;
    visited.add(url);
    console.log(`🌐 Visiting: ${url}`);

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36"
    );

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
      // صبر کن تا المان‌های خاص لود بشن (برای Elementor)
      await page.waitForTimeout(2500);
    } catch (err) {
      console.warn(`❌ Timeout or navigation error: ${url}`);
      await page.close();
      continue;
    }

    const html = await page.content();
    const $ = cheerio.load(html);

    // 🔍 کشف لینک‌های داخلی (دوره‌ها، اساتید، بلاگ، خبر)
    $(
      'a[href^="/course/"], a[href^="/teacher/"], a[href^="/blog/"], a[href^="/news/"]'
    ).each((i, a) => {
      const href = $(a).attr("href");
      if (href && href.startsWith("/")) queue.add(BASE + href);
    });

    // تشخیص نوع صفحه و ذخیره محتوا
    if (/\/course\//.test(url) && !$("body").is(".archive")) {
      data.candosite_courses.push(parseCourse($, url));
    } else if (/\/teacher\//.test(url)) {
      data.candosite_teachers.push(parseTeacher($, url));
    } else if (/\/blog\//.test(url)) {
      data.candosite_blog.push(parseCourse($, url));
    } else if (/\/news\//.test(url)) {
      data.candosite_news.push(parseCourse($, url));
    } else if (/\/faq/.test(url)) {
      $(".elementor-accordion-item").each((i, el) => {
        const q = cleanText($(el).find("h3, .elementor-tab-title").text());
        const a = cleanText($(el).find(".elementor-tab-content").text());
        if (q && a) data.candosite_faq.push({ question: q, answer: a, url });
      });
    }

    await page.close();
    await sleep(RATE_MS);
  }

  await browser.close();
  return data;
}

// ===== سینک با MongoDB =====
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
  console.log("🚀 Starting full deep crawl (v3.1)...");
  const data = await crawlSite();
  fs.writeFileSync(
    path.join(OUT, "candosite_full_dump.json"),
    JSON.stringify(data, null, 2),
    "utf-8"
  );
  await syncMongo(data);
  console.log("🎯 Finished full deep crawl and MongoDB sync!");
}

run().catch(console.error);
