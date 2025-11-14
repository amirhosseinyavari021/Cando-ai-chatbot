// backend/controllers/aiController.js
import fetch from "node-fetch";

export function health(req, res) {
  res.json({ ok: true, service: "cando-backend", ts: Date.now() });
}

function hasOpenAI() {
  return !!process.env.OPENAI_API_KEY;
}

export async function handleChat(req, res) {
  try {
    const { sessionId = "web-session" } = req.body || {};
    let { message, history = [] } = req.body || {};

    if ((!message || typeof message !== "string") && Array.isArray(req.body?.messages)) {
      const msgs = req.body.messages;
      const lastUser = [...msgs].reverse().find(m => m?.role === "user" && typeof m?.content === "string");
      message = lastUser?.content || "";
      history = msgs.map(m => ({ role: m.role, content: m.content }));
    }
    if (!message || typeof message !== "string") {
      return res.status(400).json({ ok: false, error: "Invalid message (need 'message' or 'messages[]')" });
    }

    if (!hasOpenAI()) {
      return res.json({ ok: true, sessionId, reply: "No response from OpenAI." });
    }

    // TODO: اینجا کال واقعی OpenAI
    return res.json({ ok: true, sessionId, reply: "TEMP: OpenAI call not implemented" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message || "Server error" });
  }
}

export async function handleChatStream(req, res) {
  try {
    const { sessionId = "web-session" } = req.body || {};
    let { message, history = [] } = req.body || {};

    if ((!message || typeof message !== "string") && Array.isArray(req.body?.messages)) {
      const msgs = req.body.messages;
      const lastUser = [...msgs].reverse().find(m => m?.role === "user" && typeof m?.content === "string");
      message = lastUser?.content || "";
      history = msgs.map(m => ({ role: m.role, content: m.content }));
    }
    if (!message || typeof message !== "string") {
      res.status(400);
      return res.end('event: error\ndata: {"error":"Invalid message (need message or messages[]"}\n\n');
    }

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const write = (obj, event) => {
      if (event) res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(obj)}\n\n`);
    };

    if (!hasOpenAI()) {
      write({ content: "سرویس موقتا بدون کلید OpenAI است." });
      write({ content: "پیام ساختگی برای تست استریم." });
      write({ content: "وقتی کلید ست شد، جریان واقعی فعال می‌شود." });
      res.write("event: done\n");
      res.write("data: [DONE]\n\n");
      return res.end();
    }

    // TODO: استریم واقعی OpenAI
    write({ content: "TEMP streaming..." });
    res.write("event: done\n");
    res.write("data: [DONE]\n\n");
    return res.end();
  } catch (e) {
    console.error(e);
    try {
      res.write(`event: error\ndata: ${JSON.stringify({ error: e.message || "stream error" })}\n\n`);
    } catch {}
    return res.end();
  }
}
