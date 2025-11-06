// frontend/src/pages/ChatPage.tsx
import React from "react";
import { useChatStore } from "@/stores/useChatStore";
import { MessageList } from "@/components/MessageList";
import { Composer } from "@/components/Composer";
import { Header } from "@/components/Header";

export const ChatPage: React.FC = () => {
  const sendMessage = useChatStore((s) => s.send);
  const messages = useChatStore((s) => s.messages);

  return (
    <div className="flex flex-col h-screen bg-background text-text-default">
      <Header />
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList />
      </div>
      <Composer />
    </div>
  );
};
