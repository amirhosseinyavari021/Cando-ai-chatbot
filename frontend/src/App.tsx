import React from "react";
import { MessageList } from "@/components/MessageList";
import { Composer } from "@/components/Composer";

function App() {
  return (
    <div className="flex flex-col h-screen bg-background text-text-default">
      <MessageList />
      <Composer />
    </div>
  );
}

export default App;
