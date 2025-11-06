// frontend/src/components/Header.tsx
import React from "react";
import { useChatStore } from "@/stores/useChatStore";

export const Header: React.FC = () => {
  const reset = useChatStore((s) => s.reset);

  return (
    <header className="w-full flex justify-between items-center p-3 border-b border-border bg-surface">
      <h1 className="text-lg font-semibold text-primary">Cando Chatbot</h1>
      <button
        onClick={() => reset()}
        className="text-sm px-3 py-1 rounded-lg bg-primary text-white hover:bg-primary/90 transition"
      >
        شروع گفتگو جدید
      </button>
    </header>
  );
};
