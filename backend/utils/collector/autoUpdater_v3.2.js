#!/usr/bin/env node
/**
 * Cando Auto Updater v3.2 — Hybrid & Resilient
 * ------------------------------------------------
 * ✅ منبع لینک‌ها: seed ثابت + کشف از صفحات + sitemap.xml (اگر موجود باشد)
 * ✅ رندر JS با Puppeteer (Chromium Snap)
 * ✅ اگر Puppeteer روی URL خاص fail شد => fallback به axios+cheerio
 * ✅ خروجی تمیز در کالکشن‌های مجزا: candosite_courses/teachers/blog/news/faq
 */

import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { MongoClient } from "mongodb";

// ===== تنظیمات پایه =====
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set.");
  process.exit(1);
}
const BASE = "https://cando.ac";
const OUT = path.resolve("./output_v3_2");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

// سرعت/Timeout
const RATE_MS = 1000;
const PUP_TIMEOUT = 120000; // 120s
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (t = "") => t.replace(/\s+/g, " ").trim();
const isFa = (s = "") => /[\u0600-\u06FF]/.test(s);

function log(msg) {
  console.log(msg);
  fs.appendFileSync(path.join(OUT, "crawler.log"), `[${new Date().toISOString()}] ${msg}\n`);
}

// ===== Puppeteer launcher (Chromium Snap) =====
async function launchBrowser() {
  return await puppeteer.launch({
    headless: "new",
    executablePath: "/usr/bin/chromium-browser", // Ubuntu Snap wrapper
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
    ],
  });
}

// ===== HTML fetchers =====
async function fetchWithPuppeteer(browser, url) {
  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);
  page.setDefaultNavigationTimeout(PUP_TIMEOUT);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    // کمی صبر تا ویجت‌های Elementor بارگذاری شوند
    await page.waitForTimeout(2500);
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
  // اول Puppeteer؛ اگر خطا داد، می‌افتیم روی axios
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
  const contentHtml = $("main, article, .content").first().html() || "";
  const contentText = clean($("main, article, .content").text());
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
    clean($("h1").text()) ||
    $('meta[property="og:title"]').attr("content") ||
    clean($("title").text());
  const bio = clean($(".entry-content, article, .teacher-bio").text());
  const courses = $('a[href*="/course/"]')
    .map((i, a) => clean($(a).text()))
    .get();
  return { type: "teacher", url, name, bio, courses };
}

function parseStatic($, url, type) {
  const title =
    clean($("h1").text()) ||
    $('meta[property="og:title"]').attr("content") ||
    clean($("title").text());
  const contentHtml = $("main, article, .entry-content, .content").first().html() || "";
  const contentText = clean($("main, article, .entry-content, .content").text());
  return { type, url, title, contentHtml, contentText };
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
  const candidates = [
    `${BASE}/sitemap.xml`,
    `${BASE}/sitemap_index.xml`,
    `${BASE}/sitemap_index.xml.gz`,
  ];
  for (const sm of candidates) {
    try {
      const xml = await fetchHTML(browser, sm);
      const parser = new XMLParser({ ignoreAttributes: false });
      const obj = parser.parse(xml);

      // دو حالت: sitemapindex یا urlset
      if (obj.sitemapindex?.sitemap) {
        const sitemaps = Array.isArray(obj.sitemapindex.sitemap)
          ? obj.sitemapindex.sitemap
          : [obj.sitemapindex.sitemap];
        for (const s of sitemaps) {
          const loc = s.loc || s["#text"] || s.url || "";
          if (!loc) continue;
          try {
            const xml2 = await fetchHTML(browser, loc);
            const o2 = parser.parse(xml2);
            const items = Array.isArray(o2.urlset?.url) ? o2.urlset.url : o2.urlset?.url ? [o2.urlset.url] : [];
            for (const it of items) {
              const loc2 = it.loc || it["#text"] || "";
              if (/\/(course|teacher|blog|news|faq)\//.test(loc2)) urls.add(loc2);
            }
          } catch {}
        }
      } else if (obj.urlset?.url) {
        const items = Array.isArray(obj.urlset.url) ? obj.urlset.url : [obj.urlset.url];
        for (const it of items) {
          const loc = it.loc || it["#text"] || "";
          if (/\/(course|teacher|blog|news|faq)\//.test(loc)) urls.add(loc);
        }
      }
    } catch {
      // سکوت؛ برخی سایت‌ها sitemap ندارند یا محدود می‌کنند
    }
  }
  return urls;
}

// ===== Mongo Sync =====
async function syncMongo(buckets) {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  for (const [name, docs] of Object.entries(buckets)) {
    if (!docs.length) continue;
    const coll = db.collection(name);
    const ops = docs.map((d) => ({
      updateOne: {
        filter: { url: d.url },
        update: { $set: d, $setOnInsert: { createdAt: new Date() } },
        upsert: true,
      },
    }));
    await coll.bulkWrite(ops, { ordered: false });
    log(`✅ Synced ${docs.length} docs to ${name}`);
  }
  await client.close();
}

// ===== Runner =====
async function run() {
  console.log("🚀 Starting full deep crawl (v3.2-hybrid)...");
  const browser = await launchBrowser();

  // صف اولیه + کشف از sitemap
  const queue = new Set([
    `${BASE}/course/`,
    `${BASE}/teachers/`,
    `${BASE}/blog/`,
    `${BASE}/news/`,
    `${BASE}/faq/`,
    `${BASE}/about/`,
    `${BASE}/contact/`,
  ]);

  // تلاش برای sitemap
  const smUrls = await discoverFromSitemap(browser);
  for (const u of smUrls) queue.add(u);

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
      log(`❌ Total fetch failure: ${url} → ${e.message}`);
      await sleep(RATE_MS);
      continue;
    }

    const $ = cheerio.load(html);
    // فقط صفحات فارسی (نویز انگلیسی حذف)
    if (!isFa($("body").text())) {
      await sleep(RATE_MS);
      continue;
    }

    // کشف لینک‌های جدید از همین صفحه
    const found = discoverLinks($);
    for (const u of found) if (!visited.has(u)) queue.add(u);

    // طبقه‌بندی و پارس
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
    } catch (e) {
      log(`❌ Parse error @ ${url} → ${e.message}`);
    }

    await sleep(RATE_MS);
  }

  await browser.close();

  // ذخیره خروجی جهت دیباگ
  fs.writeFileSync(path.join(OUT, "candosite_dump.json"), JSON.stringify(buckets, null, 2), "utf-8");

  // سینک به Mongo
  await syncMongo(buckets);

  console.log("🎯 Finished full deep crawl and MongoDB sync!");
}

run().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
