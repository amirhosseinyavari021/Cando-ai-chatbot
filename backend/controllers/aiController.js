// backend/controllers/aiController.js
import { Readable } from "node:stream";

// اگر کلاینت OpenAI داری از همون فایل/ماژولت ایمپورتش کن.
// اینجا ایمن می‌نویسم که اگر Key نبود، graceful رفتار کنیم.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

/** سلامت سرویس */
export function health(req, res) {
  res.json({ ok: true, ts: Date.now() });
}

/** پاسخ نُرمال بدون استریم */
export async function handleChat(req, res) {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array required" });
    }

    // اگر کلید نیست، حداقل جواب بده که Front شکست نخوره
    if (!OPENAI_API_KEY) {
      return res.status(503).json({
        error: "OPENAI_API_KEY missing",
        message:
          "Service temporarily unavailable (no OPENAI key). Streaming disabled.",
      });
    }

    // ----- اینجا لایه واقعی فراخوانی مدل رو بگذار -----
    // نمونه‌ی ساده (غیر استریم) — خودت با کلاینتت جایگزین کن
    const last = messages[messages.length - 1]?.content || "";
    const reply = `سلام! پیام شما دریافت شد: «${last}».`;

    return res.json({
      role: "assistant",
      content: reply,
    });
  } catch (err) {
    console.error("handleChat error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
}

/** پاسخ استریم (SSE) */
export async function handleChatStream(req, res) {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      res.writeHead(400, {
        "Content-Type": "text/plain; charset=utf-8",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
      });
      return res.end("messages array required");
    }

    // هدرهای SSE
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    // برای nginx قدیمی:
    // res.flushHeaders?.();

    // اگر کلید نیست، به‌صورت امن یک استریم ساختگی می‌فرستیم تا فرانت نخوابه
    if (!OPENAI_API_KEY) {
      const fake = [
        "سرویس موقتاً بدون کلید OpenAI است.",
        "برای تست استریم، این پیام ساختگی ارسال شد.",
        "وقتی کلید ست شد، جریان واقعی فعال می‌شود.",
      ];
      for (const chunk of fake) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        await new Promise((r) => setTimeout(r, 200));
      }
      res.write("event: done\ndata: [DONE]\n\n");
      return res.end();
    }

    // ----- اینجا استریم واقعی مدل رو پیاده کن -----
    // جهت تست پایدار، همین استریم ساختگی رو نگه داریم.
    const last = messages[messages.length - 1]?.content || "";
    const tokens = [
      "سلام! ",
      "من چت‌بات کَندو هستم. ",
      "پیام شما: ",
      `«${last}». `,
      "استریم OK ✅",
    ];
    for (const t of tokens) {
      res.write(`data: ${JSON.stringify({ content: t })}\n\n`);
      await new Promise((r) => setTimeout(r, 80));
    }
    res.write("event: done\ndata: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("handleChatStream error:", err);
    // به‌جای 502 (که NGINX ممکنه بد تفسیر کنه)، استریم را با پیام خطا ببند:
    try {
      res.write(`event: error\ndata: ${JSON.stringify({ error: "stream_error" })}\n\n`);
      res.write("event: done\ndata: [DONE]\n\n");
      res.end();
    } catch (_) {
      // اگر همین هم نشد، فقط سوکت بسته می‌شود.
    }
  }
}
