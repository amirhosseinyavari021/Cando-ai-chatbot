import React, { useState, useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { ArrowUp, Paperclip, Square } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';

const ChatInput = ({ onSend, onStop, status }) => {
  const [input, setInput] = useState('');
  const { t } = useTranslation();
  const formRef = useRef(null);
  const inputRef = useRef(null);
  const isLoading = status === 'loading' || status === 'fallback';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex items-end gap-2 max-w-3xl mx-auto"
    >
      {/* File Upload Button */}
      <Button variant="ghost" size="icon" type="button" aria-label={t('attachFile')}>
        <Paperclip className="w-5 h-5 text-muted-foreground" />
      </Button>

      {/* Text Input */}
      <div className="flex-1 relative">
        <TextareaAutosize
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          dir="auto"
          placeholder={t('writeMessage')}
          disabled={isLoading}
          maxRows={8}
          className="w-full p-3 pr-12
                     bg-secondary
                     border border-border
                     rounded-lg 
                     resize-none 
                     focus:outline-none focus:ring-2 focus:ring-ring
                     placeholder:text-muted-foreground"
        />
      </div>

      {/* Send / Stop Button */}
      {isLoading ? (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="flex-shrink-0"
          onClick={onStop}
          aria-label={t('stopGenerating')}
        >
          <Square className="w-5 h-5" />
        </Button>
      ) : (
        <Button
          type="submit"
          size="icon"
          className="flex-shrink-0"
          disabled={!input.trim()}
          aria-label={t('sendMessage')}
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
    </form>
  );
};

export default ChatInput;