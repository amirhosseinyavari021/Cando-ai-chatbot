import React from 'react';
import MessageBubble from './MessageBubble';
import Welcome from './Welcome';
import LoadingSpinner from './LoadingSpinner';

const ChatWindow = ({ messages, status, messagesEndRef, onSendSuggestion }) => {
  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {!hasMessages && status === 'idle' && (
          <Welcome onSendSuggestion={onSendSuggestion} />
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        
        {status === 'loading' && (
          <MessageBubble
            message={{ sender: 'bot' }}
            isLoading={true}
          />
        )}
        
        {status === 'fallback' && (
          <MessageBubble
            message={{ sender: 'bot', text: 'Using fallback model...' }}
            isLoading={true}
          />
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;