import React from 'react';
import { useChat } from '../hooks/useChat';
import ChatWindow from '../components/Chat/ChatWindow';
import ChatInput from '../components/Chat/ChatInput';
import { AlertCircle } from 'lucide-react';

const HomePage = () => {
  const {
    messages,
    status,
    error,
    sendMessage,
    handleStopGenerating,
    clearError,
    messagesEndRef,
  } = useChat();

  return (
    // flex-1 ensures this component fills the 'main' tag from Layout.jsx
    // overflow-hidden is critical for the child (ChatWindow) to scroll
    <div className="flex-1 flex flex-col h-full overflow-hidden">

      {/* Chat Window (Scrolling Area) */}
      <ChatWindow
        messages={messages}
        status={status}
        messagesEndRef={messagesEndRef}
        onSendSuggestion={sendMessage}
      />

      {/* Chat Input (Fixed Bottom Bar) */}
      <div className="flex-shrink-0 p-3 md:p-6 border-t border-border bg-background">

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="flex-1">{error}</p>
            <button
              onClick={clearError}
              className="font-medium hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <ChatInput
          onSend={sendMessage}
          onStop={handleStopGenerating}
          status={status}
        />
      </div>
    </div>
  );
};

export default HomePage;