import React from 'react';
import { User, Bot } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAutoDirection } from '../../hooks/useAutoDirection';
import LoadingSpinner from './LoadingSpinner';

const MessageBubble = ({ message, isLoading = false }) => {
  const { sender, text, isError } = message;
  const isUser = sender === 'user';
  const direction = useAutoDirection(text);

  return (
    <div
      className={cn(
        'flex items-start gap-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <Bot className="w-5 h-5 text-secondary-foreground" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          'p-3.5 rounded-2xl max-w-[80%]',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-lg' // User bubble
            : 'bg-card border border-border text-card-foreground rounded-bl-lg', // Bot bubble
          isError ? 'bg-destructive/20 text-destructive border-destructive/50' : ''
        )}
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <p
            dir={direction}
            className="whitespace-pre-wrap break-words"
            style={{ textAlign: direction === 'rtl' ? 'right' : 'left' }}
          >
            {text}
          </p>
        )}
      </div>

      {/* Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;