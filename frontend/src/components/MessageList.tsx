import React, { useEffect, useRef } from "react";
import { useChatStore } from "@/stores/useChatStore";
import MessageItem from "./MessageItem"; // ✅ اصلاح نهایی: بدون {}

export const MessageList: React.FC = () => {
  const { messages } = useChatStore();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={listRef}
      className="flex flex-col gap-3 overflow-y-auto h-full px-4 py-3 scrollbar-thin scrollbar-thumb-neutral-400 dark:scrollbar-thumb-neutral-700"
    >
      {messages.length === 0 && (
        <div className="text-center text-neutral-500 dark:text-neutral-400 mt-10">
          👋 Welcome! Type your question to start chatting.
        </div>
      )}
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
    </div>
  );
};
