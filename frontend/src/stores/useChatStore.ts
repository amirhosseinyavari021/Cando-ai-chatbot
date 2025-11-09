// frontend/src/stores/useChatStore.ts
import { create } from "zustand";

export type Role = "user" | "assistant" | "system" | "error";

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  createdAt: number;
}

interface ChatState {
  theme: "dark" | "light";
  messages: ChatMessage[];
  sending: boolean;
  abortCtrl: AbortController | null;

  setTheme: (t: "dark" | "light") => void;
  reset: () => void;
  stop: () => void;

  send: (text: string) => Promise<void>;
  regen: (userMsgId: string) => Promise<void>;
  editAndResend: (userMsgId: string, newText: string) => Promise<void>;
  copy: (id: string) => Promise<void>;
}

function mkId() {
  return Math.random().toString(36).slice(2);
}

const MAX_MEMORY = 12;
function buildHistory(messages: ChatMessage[]) {
  const last = messages.slice(-MAX_MEMORY);
  return last.map((m) => ({ role: m.role, content: m.text }));
}

async function streamChat(
  payload: any,
  signal: AbortSignal,
  onDelta: (chunk: string) => void
): Promise<{ full: string }> {
  const res = await fetch("/api/ai/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok || !res.body) throw new Error("STREAM_ERROR");

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let acc = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        if (json.delta) {
          acc += json.delta;
          onDelta(json.delta);
        }
      } catch {}
    }
  }
  return { full: acc };
}

export const useChatStore = create<ChatState>((set, get) => ({
  theme: "dark",
  messages: [],
  sending: false,
  abortCtrl: null,

  setTheme: (t) => {
    set({ theme: t });
    document.documentElement.dataset.theme = t;
  },

  reset: () => set({ messages: [] }),

  stop: () => {
    const ctrl = get().abortCtrl;
    if (ctrl) ctrl.abort();
    set({ sending: false, abortCtrl: null });
  },

  copy: async (id: string) => {
    const msg = get().messages.find((m) => m.id === id);
    if (msg?.text) {
      await navigator.clipboard.writeText(msg.text);
    }
  },

  send: async (text: string) => {
    const userMsg: ChatMessage = { id: mkId(), role: "user", text, createdAt: Date.now() };
    set((s) => ({ messages: [...s.messages, userMsg], sending: true }));

    const botId = mkId();
    set((s) => ({
      messages: [...s.messages, { id: botId, role: "assistant", text: "", createdAt: Date.now() }],
    }));

    const ctrl = new AbortController();
    set({ abortCtrl: ctrl });

    try {
      await streamChat(
        {
          message: text,
          sessionId: "web",
          history: buildHistory(get().messages),
        },
        ctrl.signal,
        (delta) => {
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === botId ? { ...m, text: m.text + delta } : m
            ),
          }));
        }
      );
    } catch (e: any) {
      if (e.name === "AbortError") {
        // توقف استریم
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === botId ? { ...m, text: m.text + "\n\n⏹️ پاسخ متوقف شد." } : m
          ),
        }));
      } else {
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === botId ? { ...m, role: "error", text: "⚠️ خطا در پاسخ‌گویی" } : m
          ),
        }));
      }
    } finally {
      set({ sending: false, abortCtrl: null });
    }
  },

  regen: async (userMsgId: string) => {
    const s = get();
    const user = s.messages.find((m) => m.id === userMsgId && m.role === "user");
    if (!user) return;
    await get().send(user.text);
  },

  editAndResend: async (userMsgId: string, newText: string) => {
    set((s) => ({
      messages: s.messages.map((m) => (m.id === userMsgId ? { ...m, text: newText } : m)),
    }));
    await get().send(newText);
  },
}));
