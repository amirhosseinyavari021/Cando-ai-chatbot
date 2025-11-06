// frontend/src/components/MessageList.tsx
import React, { useEffect, useRef } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { MessageItem } from "./MessageItem";

export const MessageList: React.FC = () => {
  const messages = useChatStore((s) => s.messages);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-3 py-2">
      {messages.map((m) => (
        <MessageItem key={m.id} msg={m} />
      ))}
    </div>
  );
};
