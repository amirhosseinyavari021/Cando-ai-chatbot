#!/usr/bin/env node
/**
 * Cando Auto Updater v3.3 — Final (JS-Rendered, Elementor-Friendly)
 * -----------------------------------------------------------------
 * ✅ Puppeteer با رندر کامل JS (networkidle0 + scroll)
 * ✅ مسدودسازی منابع سنگین (img/css/font/media) برای سرعت
 * ✅ کشف لینک‌ها از صفحات و sitemap
 * ✅ Fallback به axios+cheerio اگر Puppeteer جایی خطا داد
 * ✅ ذخیره تمیز در کالکشن‌های candosite_*
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
const PUP_TIMEOUT = 180000; // 180s
const MAX_VISITS = 600;     // سقف اطمینان برای Crawl
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (t = "") => t.replace(/\s+/g, " ").trim();
const isFa = (s = "") => /[\u0600-\u06FF]/.test(s);

function log(msg) {
  console.log(msg);
  fs.appendFileSync(path.join(OUT, "crawler.log"), `[${new Date().toISOString()}] ${msg}\n`);
}

// ===== راه‌اندازی مرورگر (Chromium Snap) =====
async function launchBrowser() {
  return await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/chromium-browser", // Ubuntu Snap wrapper
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
    ],
    // defaultViewport: { width: 1366, height: 900 }, // در صورت نیاز
  });
}

// مسدودسازی منابع سنگین و trackerها
async function hardenPage(page) {
  await page.setUserAgent(USER_AGENT);
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const type = req.resourceType();
    const url = req.url();

    // منابعی که برای Crawling لازم نیست
    if (
      type === "image" ||
      type === "stylesheet" ||
      type === "font" ||
      type === "media" ||
      type === "manifest" ||
      type === "websocket"
    ) {
      return req.abort();
    }
    // ردیاب‌های رایج
    if (/google-analytics|gtag|doubleclick|hotjar|facebook|pixel|clarity/i.test(url)) {
      return req.abort();
    }
    req.continue();
  });
}

// اسکرول تا انتهای صفحه برای لود Lazy
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

// باز کردن و آماده‌سازی HTML – با رندر کامل
async function fetchWithPuppeteer(browser, url) {
  const page = await browser.newPage();
  await hardenPage(page);
  page.setDefaultNavigationTimeout(PUP_TIMEOUT);

  try {
    await page.goto(url, { waitUntil: ["domcontentloaded", "networkidle0"] });

    // اگر Elementor وجود دارد، کمی صبر و اسکرول کن
    await page.evaluate(() => document.readyState);
    await new Promise((r) => setTimeout(r, 1200));
    await autoScroll(page);

    // بازکردن آکاردئون FAQ (در صورت وجود)
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

// نسخه‌ی سبک‌تر بدون JS
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
    .map((i, a) => clean($(a).text())))
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
  // برای سادگی از همان ساختار course استفاده می‌کنیم چون title/desc/main مشابه است
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
  const candidates = [
    `${BASE}/sitemap.xml`,
    `${BASE}/sitemap_index.xml`,
    `${BASE}/sitemap_index.xml.gz`,
  ];
  for (const sm of candidates) {
    try {
      const xml = await fetchHTML(browser, sm);
      const obj = parser.parse(xml);

      // urlset
      if (obj.urlset?.url) {
        const items = Array.isArray(obj.urlset.url) ? obj.urlset.url : [obj.urlset.url];
        for (const it of items) {
          const loc = it.loc || it["#text"] || "";
          if (/\/(course|teacher|blog|news|faq)\//.test(loc)) urls.add(loc);
        }
      }

      // اگر sitemapindex بود، لینک زیرنقشه‌ها را هم واکشی کن
      if (obj.sitemapindex?.sitemap) {
        const maps = Array.isArray(obj.sitemapindex.sitemap)
          ? obj.sitemapindex.sitemap
          : [obj.sitemapindex.sitemap];

        for (const m of maps) {
          const loc = m.loc || m["#text"] || "";
          if (!loc) continue;
          try {
            const xml2 = await fetchHTML(browser, loc);
            const o2 = parser.parse(xml2);
            const items = Array.isArray(o2.urlset?.url)
              ? o2.urlset.url
              : o2.urlset?.url
              ? [o2.urlset.url]
              : [];
            for (const it of items) {
              const l2 = it.loc || it["#text"] || "";
              if (/\/(course|teacher|blog|news|faq)\//.test(l2)) urls.add(l2);
            }
          } catch {}
        }
      }
    } catch {
      // سکوت
    }
  }
  return urls;
}

// ===== Mongo Sync =====
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
  console.log("🚀 Starting full deep crawl (v3.3)...");
  const browser = await launchBrowser();

  // Seed ابتدایی + کشف از sitemap
  const queue = new Set([
    `${BASE}/course/`,
    `${BASE}/teachers/`,
    `${BASE}/blog/`,
    `${BASE}/news/`,
    `${BASE}/faq/`,
    `${BASE}/about/`,
    `${BASE}/contact/`,
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

  let visitCount = 0;

  for (const url of queue) {
    if (visited.has(url)) continue;
    if (++visitCount > MAX_VISITS) {
      log(`⛔ Reached MAX_VISITS=${MAX_VISITS}, stopping to be safe.`);
      break;
    }
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
    // فقط صفحات فارسی را نگه داریم (نویز کمتر)
    const bodyText = $("body").text();
    if (!isFa(bodyText) && !/\/(sitemap|xml|feed)/.test(url)) {
      await sleep(RATE_MS);
      continue;
    }

    // کشف لینک‌های جدید
    const found = discoverLinks($);
    for (const u of found) if (!visited.has(u)) queue.add(u);

    // طبقه‌بندی و پارس
    try {
      if (/\/course\//.test(url) && !$("body").is(".archive")) {
        buckets.candosite_courses.push(parseCourse($, url));
      } else if (/\/teacher\//.test(url)) {
        buckets.candosite_teachers.push(parseTeacher($, url));
      } else if (/\/blog\//.test(url) && !$("body").is(".archive")) {
        buckets.candosite_blog.push(parseBlogOrNews($, url));
      } else if (/\/news\//.test(url) && !$("body").is(".archive")) {
        buckets.candosite_news.push(parseBlogOrNews($, url));
      } else if (/\/faq/.test(url)) {
        buckets.candosite_faq.push(...parseFaq($, url));
      }
    } catch (err) {
      log(`❌ Parse error @ ${url} → ${err.message}`);
    }

    await sleep(RATE_MS);
  }

  await browser.close();

  // ذخیره خروجی برای دیباگ
  fs.writeFileSync(path.join(OUT, "candosite_dump.json"), JSON.stringify(buckets, null, 2), "utf-8");

  // سینک با Mongo
  await syncMongo(buckets);

  console.log("🎯 Finished full deep crawl and MongoDB sync!");
}

run().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
