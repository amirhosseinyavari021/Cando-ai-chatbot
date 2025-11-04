#!/usr/bin/env node
/**
 * Cando Auto Updater v3.2 (Fixed)
 * -------------------------------------------
 * نسخه پایدار مخصوص Ubuntu + Chromium Snap
 * ✅ بدون ارور waitForTimeout
 * ✅ پشتیبانی از Puppeteer و fallback به axios
 * ✅ Crawl عمیق با کشف لینک‌ها و sitemap
 * ✅ ذخیره در کالکشن‌های candosite_*
 */

import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { MongoClient } from "mongodb";

// ===== تنظیمات عمومی =====
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set.");
  process.exit(1);
}

const BASE = "https://cando.ac";
const OUT = path.resolve("./output_v3_2");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

const RATE_MS = 1000;
const PUP_TIMEOUT = 120000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (t = "") => t.replace(/\s+/g, " ").trim();
const isFa = (s = "") => /[\u0600-\u06FF]/.test(s);

// ===== راه‌اندازی مرورگر =====
async function launchBrowser() {
  return await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/chromium-browser", // مسیر مخصوص Ubuntu Snap
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
    ],
  });
}

// ===== تابع‌های کمکی =====
function log(msg) {
  console.log(msg);
  fs.appendFileSync(path.join(OUT, "crawler.log"), `[${new Date().toISOString()}] ${msg}\n`);
}

async function fetchWithPuppeteer(browser, url) {
  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);
  page.setDefaultNavigationTimeout(PUP_TIMEOUT);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    // به‌جای page.waitForTimeout()
    await new Promise((r) => setTimeout(r, 2500));
    const html = await page.content();
    await page.close();
    return html;
  } catch (e) {
    await page.close().catch(() => {});
    throw e;
  }
}

async function fetchWithAxios(url) {
  const res = await axios.get(url, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "fa,en;q=0.8" },
    timeout: 30000,
    maxRedirects: 5,
    validateStatus: (s) => s < 500,
  });
  if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
  return res.data;
}

async function fetchHTML(browser, url) {
  try {
    return await fetchWithPuppeteer(browser, url);
  } catch (e) {
    log(`⚠️ Puppeteer failed for ${url} → ${e.message}; falling back to axios`);
    return await fetchWithAxios(url);
  }
}

// ===== پارسرها =====
function parseCourse($, url) {
  const title =
    clean($("h1").text()) ||
    $('meta[property="og:title"]').attr("content") ||
    clean($("title").text());
  const desc =
    clean($(".entry-summary, .course-excerpt, p").first().text()) ||
    $('meta[name="description"]').attr("content") ||
    "";
  const syllabus = $("ul li")
    .map((i, li) => clean($(li).text()))
    .get()
    .filter((x) => x.length > 3);
  const instructors = $('a[href*="/teacher/"], .teacher, .instructor')
    .map((i, a) => clean($(a).text()))
    .get();
  const contentHtml = $("main, article, .content").first().html() || "";
  const contentText = clean($("main, article, .content").text());
  return { type: "course", url, title, desc, syllabus, instructors, contentHtml, contentText };
}

function parseTeacher($, url) {
  const name =
    clean($("h1").text()) ||
    $('meta[property="og:title"]').attr("content") ||
    clean($("title").text());
  const bio = clean($(".entry-content, article, .teacher-bio").text());
  const courses = $('a[href*="/course/"]').map((i, a) => clean($(a).text())).get();
  return { type: "teacher", url, name, bio, courses };
}

function parseFaq($, url) {
  const items = [];
  $(".elementor-accordion-item, .accordion-item").each((i, el) => {
    const q = clean($(el).find("h3, .elementor-tab-title, .accordion-title").text());
    const a = clean($(el).find(".elementor-tab-content, .accordion-content").text());
    if (q && a) items.push({ type: "faq", url, question: q, answer: a });
  });
  return items;
}

function discoverLinks($, base = BASE) {
  const set = new Set();
  $('a[href^="/"]').each((i, a) => {
    const href = $(a).attr("href");
    if (!href) return;
    if (/^\/(course|teacher|blog|news)\//.test(href)) {
      set.add(base + href);
    }
  });
  return set;
}

async function discoverFromSitemap(browser) {
  const urls = new Set();
  const parser = new XMLParser({ ignoreAttributes: false });
  const sitemaps = [
    `${BASE}/sitemap.xml`,
    `${BASE}/sitemap_index.xml`,
    `${BASE}/sitemap_index.xml.gz`,
  ];

  for (const sm of sitemaps) {
    try {
      const xml = await fetchHTML(browser, sm);
      const obj = parser.parse(xml);
      const list = Array.isArray(obj.urlset?.url)
        ? obj.urlset.url
        : obj.urlset?.url
        ? [obj.urlset.url]
        : [];
      for (const it of list) {
        const loc = it.loc || it["#text"] || "";
        if (/\/(course|teacher|blog|news|faq)\//.test(loc)) urls.add(loc);
      }
    } catch (err) {
      log(`⚠️ Sitemap fetch failed: ${sm} → ${err.message}`);
    }
  }
  return urls;
}

// ===== MongoDB Sync =====
async function syncMongo(buckets) {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  for (const [col, docs] of Object.entries(buckets)) {
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
    log(`✅ Synced ${docs.length} docs to ${col}`);
  }
  await client.close();
}

// ===== اجرای اصلی =====
async function run() {
  console.log("🚀 Starting full deep crawl (v3.2-fixed)...");
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

  const sitemapLinks = await discoverFromSitemap(browser);
  for (const u of sitemapLinks) queue.add(u);

  const visited = new Set();
  const buckets = {
    candosite_courses: [],
    candosite_teachers: [],
    candosite_blog: [],
    candosite_news: [],
    candosite_faq: [],
  };

  for (const url of queue) {
    if (visited.has(url)) continue;
    visited.add(url);
    log(`🌐 Visiting: ${url}`);

    let html = null;
    try {
      html = await fetchHTML(browser, url);
    } catch (e) {
      log(`❌ Fetch failed: ${url} → ${e.message}`);
      await sleep(RATE_MS);
      continue;
    }

    const $ = cheerio.load(html);
    if (!isFa($("body").text())) continue;

    const found = discoverLinks($);
    for (const u of found) if (!visited.has(u)) queue.add(u);

    try {
      if (/\/course\//.test(url) && !$("body").is(".archive")) {
        buckets.candosite_courses.push(parseCourse($, url));
      } else if (/\/teacher\//.test(url)) {
        buckets.candosite_teachers.push(parseTeacher($, url));
      } else if (/\/blog\//.test(url) && !$("body").is(".archive")) {
        buckets.candosite_blog.push(parseCourse($, url));
      } else if (/\/news\//.test(url) && !$("body").is(".archive")) {
        buckets.candosite_news.push(parseCourse($, url));
      } else if (/\/faq/.test(url)) {
        buckets.candosite_faq.push(...parseFaq($, url));
      }
    } catch (err) {
      log(`❌ Parse error @ ${url} → ${err.message}`);
    }

    await sleep(RATE_MS);
  }

  await browser.close();

  fs.writeFileSync(path.join(OUT, "candosite_dump.json"), JSON.stringify(buckets, null, 2));
  await syncMongo(buckets);

  console.log("🎯 Finished full deep crawl and MongoDB sync!");
}

run().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
