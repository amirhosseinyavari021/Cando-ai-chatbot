#!/usr/bin/env node
/**
 * Cando Auto Updater v3.3 — Final Fixed
 * -------------------------------------
 * ✅ رفع پرانتز اضافه
 * ✅ رندر کامل JS (Elementor-Friendly)
 * ✅ Crawl عمیق از سایت Cando + Sitemap
 * ✅ ذخیره در MongoDB با upsert
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
  console.error("❌ MONGODB_URI is not set. Export it then re-run.");
  process.exit(1);
}

const BASE = "https://cando.ac";
const OUT = path.resolve("./output_v3_3");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

const RATE_MS = 900;
const PUP_TIMEOUT = 180000;
const MAX_VISITS = 600;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (t = "") => t.replace(/\s+/g, " ").trim();
const isFa = (s = "") => /[\u0600-\u06FF]/.test(s);

function log(msg) {
  console.log(msg);
  fs.appendFileSync(path.join(OUT, "crawler.log"), `[${new Date().toISOString()}] ${msg}\n`);
}

// ===== راه‌اندازی مرورگر =====
async function launchBrowser() {
  return await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/chromium-browser",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
    ],
  });
}

// ===== بهینه‌سازی صفحات =====
async function hardenPage(page) {
  await page.setUserAgent(USER_AGENT);
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const type = req.resourceType();
    const url = req.url();
    if (
      ["image", "stylesheet", "font", "media", "manifest", "websocket"].includes(type) ||
      /google-analytics|gtag|doubleclick|hotjar|facebook|pixel|clarity/i.test(url)
    ) {
      return req.abort();
    }
    req.continue();
  });
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 600;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight || document.documentElement.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight - window.innerHeight - 50) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}

// ===== Puppeteer HTML Fetch =====
async function fetchWithPuppeteer(browser, url) {
  const page = await browser.newPage();
  await hardenPage(page);
  page.setDefaultNavigationTimeout(PUP_TIMEOUT);

  try {
    await page.goto(url, { waitUntil: ["domcontentloaded", "networkidle0"] });
    await new Promise((r) => setTimeout(r, 1200));
    await autoScroll(page);

    await page.evaluate(() => {
      const headers = document.querySelectorAll(
        ".elementor-accordion-item .elementor-tab-title, .accordion-item .accordion-title"
      );
      headers.forEach((el) => {
        try {
          el.click();
        } catch {}
      });
    });
    await new Promise((r) => setTimeout(r, 900));

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
    timeout: 35000,
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

// ===== Parsers =====
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
  const contentHtml = $("main, article, .entry-content, .content").first().html() || "";
  const contentText = clean($("main, article, .entry-content, .content").text());
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

function parseBlogOrNews($, url) {
  const base = parseCourse($, url);
  base.type = /\/news\//.test(url) ? "news" : "blog";
  return base;
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

// ===== Link Discovery =====
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
  const maps = [`${BASE}/sitemap.xml`, `${BASE}/sitemap_index.xml`];

  for (const sm of maps) {
    try {
      const xml = await fetchHTML(browser, sm);
      const obj = parser.parse(xml);
      const items = Array.isArray(obj.urlset?.url)
        ? obj.urlset.url
        : obj.urlset?.url
        ? [obj.urlset.url]
        : [];
      for (const it of items) {
        const loc = it.loc || it["#text"] || "";
        if (/\/(course|teacher|blog|news|faq)\//.test(loc)) urls.add(loc);
      }
    } catch {}
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

// ===== اجرا =====
async function run() {
  console.log("🚀 Starting full deep crawl (v3.3-fixed)...");
  const browser = await launchBrowser();

  const queue = new Set([
    `${BASE}/course/`,
    `${BASE}/teachers/`,
    `${BASE}/blog/`,
    `${BASE}/news/`,
    `${BASE}/faq/`,
  ]);

  const siteLinks = await discoverFromSitemap(browser);
  for (const u of siteLinks) queue.add(u);

  const visited = new Set();
  const buckets = {
    candosite_courses: [],
    candosite_teachers: [],
    candosite_blog: [],
    candosite_news: [],
    candosite_faq: [],
  };

  let count = 0;

  for (const url of queue) {
    if (visited.has(url)) continue;
    if (++count > MAX_VISITS) break;
    visited.add(url);
    log(`🌐 Visiting: ${url}`);

    let html;
    try {
      html = await fetchHTML(browser, url);
    } catch (e) {
      log(`❌ Fetch failed: ${url} → ${e.message}`);
      continue;
    }

    const $ = cheerio.load(html);
    if (!isFa($("body").text())) continue;

    const found = discoverLinks($);
    for (const u of found) if (!visited.has(u)) queue.add(u);

    try {
      if (/\/course\//.test(url)) buckets.candosite_courses.push(parseCourse($, url));
      else if (/\/teacher\//.test(url)) buckets.candosite_teachers.push(parseTeacher($, url));
      else if (/\/blog\//.test(url)) buckets.candosite_blog.push(parseBlogOrNews($, url));
      else if (/\/news\//.test(url)) buckets.candosite_news.push(parseBlogOrNews($, url));
      else if (/\/faq/.test(url)) buckets.candosite_faq.push(...parseFaq($, url));
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
