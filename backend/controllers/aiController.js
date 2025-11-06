export async function sendChat(req, res) {
  try {
    const body = req.body || {};
    const text = String(body.text ?? body.message ?? "").trim();

    if (!text) {
      return res.status(400).json({ ok: false, message: "EMPTY_MESSAGE" });
    }

    let answer;
    if (text.includes("شبکه")) {
      answer =
        "برای مهندس شبکه شدن بهتره از دوره‌های Network+ و CCNA شروع کنی. بعدش سراغ CCNP، MikroTik و Fortinet برو.";
    } else {
      answer = `شما گفتید: ${text}`;
    }

    return res.status(200).json({ ok: true, text: answer });
  } catch (err) {
    console.error("sendChat error:", err);
    res.status(500).json({ ok: false, message: "SERVER_ERROR" });
  }
}

export async function health(_req, res) {
  res.json({ ok: true, status: "UP", ts: Date.now() });
}
