import React from "react";
import { ChatMessage } from "@/stores/useChatStore";
import { Copy, Check, Bot, User, AlertTriangle } from "lucide-react";

export default function MessageItem({ message }: { message: ChatMessage }) {
  const { role, text } = message;
  const isUser = role === "user";
  const isError = role === "error";
  const safeText = typeof text === "string" ? text : "";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} my-1`}>
      <div
        className={[
          "max-w-[90%] md:max-w-[70%] p-3 rounded-2xl whitespace-pre-wrap break-words shadow-sm",
          isUser
            ? "bg-blue-600 text-white rounded-br"
            : "bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 rounded-bl",
          isError ? "border border-red-500/50 bg-red-100/10" : "",
        ].join(" ")}
      >
        <div className="flex items-center gap-2 mb-1 text-xs opacity-70">
          {isUser ? <User size={14} /> : <Bot size={14} />}
          <span>{isUser ? "You" : "Cando Assistant"}</span>
          {isError && (
            <span className="flex items-center gap-1 text-red-500">
              <AlertTriangle size={12} />
              <span>Error</span>
            </span>
          )}
        </div>
        <div className="text-sm leading-relaxed break-words">{safeText}</div>
        {!isError && <CopyButton text={safeText} />}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text || "");
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* ignore */
        }
      }}
      className="flex items-center gap-1 text-xs mt-2 opacity-70 hover:opacity-100 transition"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
