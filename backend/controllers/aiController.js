// backend/src/controllers/aiController.js

// If you have real AI services, wire them here.
// For now we keep a safe fallback that never crashes.
export async function sendChat(req, res) {
  try {
    const body = req.body || {};
    const input = String(body.text ?? body.message ?? "").trim();

    if (!input) {
      return res.status(400).json({ ok: false, message: "EMPTY_MESSAGE" });
    }

    // TODO: replace this with your actual AI call
    const reply = `You said: ${input}`;

    return res.status(200).json({ ok: true, text: reply });
  } catch (err) {
    console.error("sendChat error:", err);
    return res.status(500).json({ ok: false, message: "SERVER_ERROR" });
  }
}

export async function health(_req, res) {
  res.json({ ok: true, ts: Date.now() });
}
