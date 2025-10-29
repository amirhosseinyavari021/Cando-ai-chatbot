import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChat } from '../../hooks/useChat.js'; // <-- Import new hook
import { SendHorizontal, StopCircle } from 'lucide-react';
import styles from './ChatBox.module.css';
import MessageBubble from './MessageBubble';
import SuggestedPrompts from './SuggestedPrompts';
import Loading from './Loading.jsx'; // <-- Import new Loading component

const ChatBox = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  // --- All logic is now in the useChat hook ---
  const {
    messages,
    status,
    error,
    sendMessage,
    handleStopGenerating,
    clearError,
    messagesEndRef,
  } = useChat();

  const isLoading = status === 'loading' || status === 'fallback';

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (error) clearError(); // Clear error on new message
    sendMessage(input);
    setInput('');
  };

  const handleSuggestionClick = (prompt) => {
    if (error) clearError();
    sendMessage(prompt);
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messageList}>
        {messages.length === 0 && !isLoading && !error && (
          <SuggestedPrompts onPromptClick={handleSuggestionClick} />
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* --- New Loading/Error UI --- */}
        {isLoading && (
          <Loading fallbackTriggered={status === 'fallback'} />
        )}
        {error && (
          <div className={styles.errorDisplay}>
            <p>{error}</p>
            <button onClick={clearError} className={styles.errorClearButton}>
              {t('chat_try_again', 'Try Again')}
            </button>
          </div>
        )}
        {/* --- End New UI --- */}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleFormSubmit} className={styles.inputForm}>
        {isLoading ? (
          <button
            type="button"
            className={`${styles.controlButton} ${styles.stopButton}`}
            onClick={handleStopGenerating}
            aria-label="Stop generating"
          >
            <StopCircle size={22} />
          </button>
        ) : (
          // Placeholder to keep layout stable
          <div style={{ width: '40px', height: '40px', flexShrink: 0 }}></div>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chat_placeholder')}
          className={styles.inputField}
          disabled={isLoading}
          aria-live="polite"
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={isLoading || !input.trim()}
          aria-label={t('chat_send_button')}
        >
          <SendHorizontal size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;