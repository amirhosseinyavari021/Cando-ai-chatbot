import { Router } from "express";
import { handleChat } from "../services/aiService.js";

const router = Router();

router.post("/chat/stream", async (req, res) => {
  try {
    const userMessage = (req.body?.message || "").toString().trim();
    if (!userMessage) {
      return res.status(400).json({ ok: false, message: "پیام خالی است." });
    }
    const answer = await handleChat(userMessage);
    return res.status(200).json({ ok: true, answer });
  } catch (err) {
    console.error("❌ /chat/stream error:", err);
    return res.status(500).json({ ok: false, message: "خطا در پاسخ‌گویی." });
  }
});

export default router;
