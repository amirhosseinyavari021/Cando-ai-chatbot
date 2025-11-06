// frontend/src/components/MessageItem.tsx
import React from "react";
import { ChatMessage } from "@/stores/useChatStore";

type Props = { msg: ChatMessage };

export const MessageItem: React.FC<Props> = ({ msg }) => {
  const isUser = msg.sender === "user";
  return (
    <div
      className={`w-full flex ${isUser ? "justify-start" : "justify-end"} my-1`}
      dir="rtl"
    >
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-6
        ${isUser ? "bg-surface border border-border" : "bg-primary text-white"}`}
      >
        {msg.text}
      </div>
    </div>
  );
};
