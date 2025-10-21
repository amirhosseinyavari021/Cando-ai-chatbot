import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// Removed createCancelTokenSource import here, managed within sendMessage
import { sendChatMessage } from '../../api';
// Updated Icons: SendHorizontal, StopCircle
import { SendHorizontal, StopCircle } from 'lucide-react'; // RefreshCw removed
import styles from './ChatBox.module.css';
import MessageBubble from './MessageBubble';
import SuggestedPrompts from './SuggestedPrompts';
import axios from 'axios'; // Needed for isCancel and CancelToken source

const ChatBox = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cancelTokenSource, setCancelTokenSource] = useState(null); // Keep for cancellation
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  // Cleanup effect remains
  useEffect(() => { return () => { cancelTokenSource?.cancel('Component unmounted.'); }; }, [cancelTokenSource]);

  // Simplified sendMessage function
  const sendMessage = async (promptText) => {
    if (isLoading || !promptText.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text: promptText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create cancel token source for THIS request
    const source = axios.CancelToken.source();
    setCancelTokenSource(source);

    try {
      // Call sendChatMessage (which now includes cancel token)
      const res = await sendChatMessage(promptText, source.token); // Pass token
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: res.data.response,
        // No need for modelUsed or requestedQuality from backend anymore
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        const cancelMessage = { id: Date.now() + 1, sender: 'bot', text: 'Generation stopped.', isError: true };
        setMessages((prev) => [...prev, cancelMessage]);
      } else {
        console.error('Error fetching chat response:', error);
        const errorMessage = {
          id: Date.now() + 1,
          sender: 'bot',
          text: error.response?.data?.message || error.message || 'Sorry, something went wrong.',
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      setCancelTokenSource(null); // Clear source after request finishes/fails/cancels
    }
  };

  const handleFormSubmit = (e) => { e.preventDefault(); sendMessage(input); };
  const handleSuggestionClick = (prompt) => { sendMessage(prompt); };
  // handleThinkDeeper removed
  const handleStopGenerating = () => { if (cancelTokenSource) { cancelTokenSource.cancel('User requested cancellation.'); } };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messageList}>
        {messages.length === 0 && !isLoading && (<SuggestedPrompts onPromptClick={handleSuggestionClick} />)}
        {messages.map((msg, index) => (
          // Remove props related to Think Deeper
          <MessageBubble
            key={msg.id || index}
            message={msg}
          />
        ))}
        {isLoading && (<div className={styles.typingIndicator}><div className={styles.dot}></div><div className={styles.dot}></div><div className={styles.dot}></div></div>)}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleFormSubmit} className={styles.inputForm}>
        {isLoading ? (
          <button type="button" className={`${styles.controlButton} ${styles.stopButton}`} onClick={handleStopGenerating}>
            <StopCircle size={22} />
          </button>
        ) : (
          <div style={{ width: "40px", height: "40px", flexShrink: 0 }}></div>
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
          <SendHorizontal size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;