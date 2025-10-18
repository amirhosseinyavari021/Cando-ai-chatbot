// Imports remain the same
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { sendChatMessage, createCancelTokenSource } from '../../api';
// Use StopCircle instead of Square for a slightly better look
import { Send, StopCircle, RefreshCw } from 'lucide-react';
import styles from './ChatBox.module.css';
import MessageBubble from './MessageBubble';
import SuggestedPrompts from './SuggestedPrompts';

// Rest of the component logic remains exactly as in the previous step
// (State, useEffects, sendMessage, handleFormSubmit, handleSuggestionClick, handleThinkDeeper, handleStopGenerating)

const ChatBox = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cancelTokenSource, setCancelTokenSource] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { return () => { cancelTokenSource?.cancel('Component unmounted.'); }; }, [cancelTokenSource]);

  const sendMessage = async (promptText, useQuality = false, originalMessageIndex = null) => {
    if (isLoading || !promptText.trim()) return;
    if (originalMessageIndex !== null) { setIsLoading(true); }
    else {
      const userMessage = { id: Date.now(), sender: 'user', text: promptText };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
    }
    if (!useQuality) setIsLoading(true);
    const source = createCancelTokenSource(); setCancelTokenSource(source);
    try {
      const res = await sendChatMessage(promptText, useQuality, source.token);
      const botMessage = { id: Date.now() + 1, sender: 'bot', text: res.data.response, modelUsed: res.data.model, originalPrompt: promptText, requestedQuality: res.data.requestedQuality };
      if (originalMessageIndex !== null) { setMessages(prev => prev.map((msg, index) => index === originalMessageIndex + 1 ? botMessage : msg)); }
      else { setMessages((prev) => [...prev, botMessage]); }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        if (originalMessageIndex === null) { const cancelMessage = { id: Date.now() + 1, sender: 'bot', text: 'Generation stopped.', isError: true }; setMessages((prev) => [...prev, cancelMessage]); }
      } else {
        console.error('Error fetching chat response:', error);
        const errorMessage = { id: Date.now() + 1, sender: 'bot', text: error.response?.data?.message || error.message || 'Sorry, something went wrong.', isError: true };
        if (originalMessageIndex !== null) { setMessages(prev => prev.map((msg, index) => index === originalMessageIndex + 1 ? errorMessage : msg)); }
        else { setMessages((prev) => [...prev, errorMessage]); }
      }
    } finally { setIsLoading(false); setCancelTokenSource(null); }
  };
  const handleFormSubmit = (e) => { e.preventDefault(); sendMessage(input, false); };
  const handleSuggestionClick = (prompt) => { sendMessage(prompt, false); };
  const handleThinkDeeper = (originalUserPrompt, originalBotMessageIndex) => { console.log(`Regenerating response for prompt: "${originalUserPrompt}" using quality model.`); sendMessage(originalUserPrompt, true, originalBotMessageIndex); };
  const handleStopGenerating = () => { if (cancelTokenSource) { cancelTokenSource.cancel('User requested cancellation.'); } };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messageList}>
        {messages.length === 0 && !isLoading && (<SuggestedPrompts onPromptClick={handleSuggestionClick} />)}
        {messages.map((msg, index) => (
          <MessageBubble
            key={msg.id || index}
            message={msg}
            index={index}
            showThinkDeeper={msg.sender === 'bot' && !msg.isError && msg.modelUsed?.includes('QWEN2.5') && !isLoading} // Adjusted condition slightly
            onThinkDeeper={handleThinkDeeper}
            originalUserPrompt={msg.originalPrompt}
            originalMessageIndex={index - 1}
          />
        ))}
        {isLoading && (<div className={styles.typingIndicator}><div className={styles.dot}></div><div className={styles.dot}></div><div className={styles.dot}></div></div>)}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleFormSubmit} className={styles.inputForm}>
        {isLoading ? (
          <button type="button" className={`${styles.controlButton} ${styles.stopButton}`} onClick={handleStopGenerating}>
            {/* Using StopCircle icon */}
            <StopCircle size={22} />
          </button>
        ) : (
          <div style={{ width: "48px" }}></div> // Adjusted placeholder width slightly
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chat_placeholder')}
          className={styles.inputField}
          disabled={isLoading}
        />
        <button type="submit" className={styles.sendButton} disabled={isLoading || !input.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;

// Make sure axios is imported if not already
import axios from 'axios';