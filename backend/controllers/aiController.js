// backend/controllers/aiController.js
import { semanticSearch } from "../services/dbSearch.js";
import { callPrimaryAI } from "../services/aiService.js";

const RESTRICT_MODE = String(process.env.RESTRICT_MODE || "true").toLowerCase() === "true";

export async function sendChat(req, res) {
  try {
    const { message = "", userId = "web-client", context = {} } = req.body || {};
    const q = String(message || "").trim();

    if (!q) {
      return res.status(400).json({ ok: false, message: "EMPTY_MESSAGE" });
    }

    // 1) جستجو در دیتابیس
    const hits = await semanticSearch(q, 1);
    if (hits.length && hits[0].text) {
      return res.json({ ok: true, result: hits[0].text, source: hits[0].source });
    }

    // 2) اگر محدود هستیم، پیام سیاست را بده
    if (RESTRICT_MODE) {
      return res.json({
        ok: true,
        result: "در حال حاضر پاسخ مستقیمی در پایگاه داده Cando پیدا نشد. لطفاً سؤال‌تان را دقیق‌تر بپرسید یا به پشتیبانی پیام دهید.",
        source: "policy",
      });
    }

    // 3) در غیر اینصورت از AI کمک بگیر
    const ai = await callPrimaryAI(q, { userId, context });
    if (ai?.ok && ai?.result) {
      return res.json({ ok: true, result: ai.result, source: "ai" });
    }

    return res.json({
      ok: false,
      message: "NO_RESULT",
    });
  } catch (err) {
    console.error("sendChat error:", err);
    return res.status(500).json({ ok: false, message: "SERVER_ERROR" });
  }
}

export async function health(req, res) {
  res.json({ ok: true, ts: Date.now(), restrict: RESTRICT_MODE });
}
