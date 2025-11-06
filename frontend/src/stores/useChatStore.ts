// frontend/src/stores/useChatStore.ts
import { create } from "zustand";
import { sendChatOnce } from "@/api/apiService";

export type Role = "user" | "assistant" | "system" | "error";

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  createdAt: number;
}

interface ChatState {
  messages: ChatMessage[];
  sending: boolean;
  sendMessage: (text: string) => Promise<void>;
  reset: () => void;
}

function mkId() {
  return Math.random().toString(36).slice(2);
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  sending: false,

  reset: () => set({ messages: [] }),

  sendMessage: async (text: string) => {
    const userMsg: ChatMessage = {
      id: mkId(),
      role: "user",
      text,
      createdAt: Date.now(),
    };

    set((s) => ({ messages: [...s.messages, userMsg], sending: true }));

    const result = await sendChatOnce(text).catch(() => ({ ok: false as const, message: "NETWORK_ERROR" }));

    if (result.ok) {
      const botMsg: ChatMessage = {
        id: mkId(),
        role: "assistant",
        text: result.text, // SAFE: ensured by apiService
        createdAt: Date.now(),
      };
      set((s) => ({ messages: [...s.messages, botMsg], sending: false }));
    } else {
      // show a single error message; do not loop on fallback
      const errMsg: ChatMessage = {
        id: mkId(),
        role: "error",
        text: result.message || "Request failed",
        createdAt: Date.now(),
      };
      set((s) => ({ messages: [...s.messages, errMsg], sending: false }));
    }
  },
}));
