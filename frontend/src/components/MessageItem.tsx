// frontend/src/components/MessageItem.tsx
import React from "react";
import { ChatMessage } from "@/stores/useChatStore";

export default function MessageItem({ message }: { message: ChatMessage }) {
  const { role, text } = message;
  const isUser = role === "user";
  const isError = role === "error";
  const safeText = typeof text === "string" ? text : "";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} my-1`}>
      <div
        className={[
          "max-w-[90%] md:max-w-[70%] p-3 rounded-2xl whitespace-pre-wrap break-words",
          isUser ? "bg-blue-600 text-white rounded-br" : "bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 rounded-bl",
          isError ? "border border-red-500/50" : "",
        ].join(" ")}
      >
        {safeText || (isError ? "Unknown error" : "")}
      </div>
    </div>
  );
}
