// frontend/src/stores/useChatStore.ts
import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { sendMessage } from "@/api/apiService";
import { toast } from "react-hot-toast";

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: number;
}

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  send: (text: string) => Promise<void>;
  reset: () => void;
  stopGenerating: () => void;
  regenerateLastResponse: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  isStreaming: false,

  send: async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("پیام نمی‌تواند خالی باشد.");
      return;
    }

    const userMessage: ChatMessage = {
      id: uuidv4(),
      sender: "user",
      text: trimmed,
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      isStreaming: true,
    }));

    try {
      const response = await sendMessage(trimmed, "web-client");
      if (response?.ok && response?.result) {
        const botMessage: ChatMessage = {
          id: uuidv4(),
          sender: "bot",
          text: response.result,
          timestamp: Date.now(),
        };
        set((state) => ({
          messages: [...state.messages, botMessage],
          isLoading: false,
          isStreaming: false,
        }));
      } else {
        toast.error(response?.error || "پاسخی از سرور دریافت نشد.");
        set({ isLoading: false, isStreaming: false });
      }
    } catch (err: any) {
      console.error("❌ Chat send() error:", err);
      toast.error("ارتباط با سرور برقرار نشد");
      set({ isLoading: false, isStreaming: false });
    }
  },

  stopGenerating: () => {
    set({ isStreaming: false, isLoading: false });
  },

  regenerateLastResponse: () => {
    const messages = get().messages;
    if (messages.length < 2) return;
    const lastUserMessage = [...messages].reverse().find((m) => m.sender === "user");
    if (lastUserMessage) {
      get().send(lastUserMessage.text);
    }
  },

  reset: () => set({ messages: [] }),
}));
