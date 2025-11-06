/// <reference types="vite/client" />

// frontend/src/api/apiService.ts
export async function sendMessage(message: string, userId = "web-client") {
  const base =
    (import.meta.env.VITE_API_BASE as string) || `${window.location.origin}`;
  const url = `${base}/api/chat/stream`;

  try {
    const payload = { message, userId };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error("❌ API error:", err?.message || err);
    return { ok: false, error: "NETWORK_OR_SERVER_ERROR" };
  }
}
