// frontend/src/api/apiService.js
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://92.242.198.86/api"; // سرور کندو

export async function checkHealth() {
  try {
    const r = await fetch(`${API_BASE_URL}/health`);
    const j = await r.json();
    return j?.message || "ok";
  } catch {
    return "unreachable";
  }
}

/**
 * استریم پاسخ با SSE و تحویل فقط متن (بدون data: {...})
 * onToken: برای آپدیت لحظه‌ای UI
 * برمی‌گرداند: متن نهایی (اگر سرور message کامل بده) یا تجمیع deltaها
 */
export async function sendMessageStream(message, history, onToken, sessionId = "web-session") {
  const res = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "text/event-stream",
    },
    body: JSON.stringify({ message, sessionId, history }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let buffer = "";
  let acc = "";
  let final = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split(/\n\n/);
    buffer = events.pop() || "";

    for (const evt of events) {
      const line = evt.trim().replace(/^data:\s*/, "");
      if (!line || line === "[DONE]") continue;

      try {
        const json = JSON.parse(line);
        if (typeof json.delta === "string") {
          acc += json.delta;
          onToken?.(json.delta);
        } else if (typeof json.message === "string") {
          final = json.message;
        }
      } catch {
        // نادیده بگیر
      }
    }
  }
  return final || acc;
}
