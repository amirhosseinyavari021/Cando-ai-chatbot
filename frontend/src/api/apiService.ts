// frontend/src/api/apiService.ts
type ChatResponse = { ok: true; text: string } | { ok: false; message?: string; error?: string }

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export async function sendChatOnce(text: string, signal?: AbortSignal): Promise<ChatResponse> {
  const url = `${API_BASE_URL}/ai/chat`;
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({ text }),
    });

    // Non-2xx: try to parse error body, but always return {ok:false}
    if (!resp.ok) {
      let errBody: any = null;
      try { errBody = await resp.json(); } catch {}
      return { ok: false, message: errBody?.message || `HTTP_${resp.status}` };
    }

    // 2xx: parse and validate
    const data: any = await resp.json();
    if (data && typeof data.text === "string") {
      return { ok: true, text: data.text };
    }
    return { ok: false, message: "BAD_RESPONSE_SHAPE" };
  } catch (e: any) {
    const aborted = e?.name === "AbortError";
    return { ok: false, message: aborted ? "ABORTED" : "NETWORK_ERROR" };
  }
}
