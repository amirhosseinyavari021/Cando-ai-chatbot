// ESM
// backend/routes/chatRouter.js
import express from "express";
import { smartSearch } from "../services/dbSearch.js";
import { makePrompt, getAnswer } from "../services/aiService.js";

const router = express.Router();

// unified endpoint (works for both your UI and any test client)
router.post("/chat/stream", async (req, res) => {
  try {
    const userMessage = String(req.body?.message || "").trim();
    if (!userMessage) {
      return res.status(400).json({ ok: false, error: "EMPTY_MESSAGE" });
    }

    // academy-only guard
    const offTopic = /(jailbreak|weather|news|poem|story|programming|politics|movie|song|translate)/i;
    if (offTopic.test(userMessage)) {
      return res.json({
        ok: true,
        answer: "من فقط درباره دوره‌ها، اساتید و اطلاعات آموزشگاه کندو می‌تونم کمک کنم 🙂",
      });
    }

    const hits = await smartSearch(userMessage); // {faq, courses, teachers}
    const messages = makePrompt(userMessage, hits); // array
    const answer = await getAnswer(messages); // plain string

    return res.json({ ok: true, answer });
  } catch (err) {
    console.error("CHAT_ROUTE_ERROR:", err);
    return res.status(500).json({
      ok: false,
      answer:
        "الان خطایی رخ داده. لطفاً دوباره تلاش کنید یا به پشتیبانی اطلاع بدید.",
    });
  }
});

// (optional) simple health
router.get("/health", (_req, res) => res.json({ ok: true }));

export default router;
