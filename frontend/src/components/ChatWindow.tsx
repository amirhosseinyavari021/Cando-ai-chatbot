import React, { useState } from "react";
import { useChatStore } from "@/stores/useChatStore";

export default function ChatWindow() {
  const { messages, sendMessage, sending } = useChatStore();
  const [text, setText] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText("");
  };

  return (
    <div className="chat-wrap">
      <div className="chat-body">
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.role}`}>
            {m.id === "typing" ? (
              <span className="dots">
                <i />
                <i />
                <i />
              </span>
            ) : (
              m.text
            )}
          </div>
        ))}
      </div>

      <form className="chat-input" onSubmit={onSubmit}>
        <input
          dir="auto"
          placeholder="سؤالت درباره‌ی کندو..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button disabled={sending}>ارسال</button>
      </form>
    </div>
  );
}
