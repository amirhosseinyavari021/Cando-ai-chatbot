import { Router } from "express";
import { handleChat } from "../services/aiService.js";

const router = Router();

/**
 * Expected payload:
 * { "message": "..." }
 */
router.post("/chat/stream", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) return res.status(400).json({ ok: false, message: "پیام خالی است" });

    const result = await handleChat(message);
    return res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error("❌ Chat error:", err);
    return res.status(500).json({ ok: false, message: "خطا در پردازش درخواست" });
  }
});

export default router;
