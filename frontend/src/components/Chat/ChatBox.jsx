import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { sendChatMessage, createCancelTokenSource } from '../../api';
import { Send, Square, RefreshCw } from 'lucide-react'; // Added RefreshCw icon
import styles from './ChatBox.module.css';
import MessageBubble from './MessageBubble';
import SuggestedPrompts from './SuggestedPrompts';

const ChatBox = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cancelTokenSource, setCancelTokenSource] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { return () => { cancelTokenSource?.cancel('Component unmounted.'); }; }, [cancelTokenSource]);

  // Main function to handle sending messages
  const sendMessage = async (promptText, useQuality = false, originalMessageIndex = null) => {
    // Don't send if already loading or no prompt
    if (isLoading || !promptText.trim()) return;

    // If it's a re-request, show loading immediately
    if (originalMessageIndex !== null) {
      setIsLoading(true);
    } else {
      // Only add user message for new prompts
      const userMessage = { id: Date.now(), sender: 'user', text: promptText };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
    }


    if (!useQuality) setIsLoading(true); // Set loading for initial fast request

    const source = createCancelTokenSource();
    setCancelTokenSource(source);

    try {
      const res = await sendChatMessage(promptText, useQuality, source.token);
      const botMessage = {
        id: Date.now() + 1, // Unique ID for bot message
        sender: 'bot',
        text: res.data.response,
        modelUsed: res.data.model, // Store which model was used (e.g., 'QWEN2_1.8B')
        originalPrompt: promptText, // Store the user prompt that generated this
        requestedQuality: res.data.requestedQuality, // Was quality requested?
      };

      if (originalMessageIndex !== null) {
        // Replace the old bot message with the new one if regenerating
        setMessages(prev => prev.map((msg, index) => index === originalMessageIndex + 1 ? botMessage : msg));
      } else {
        setMessages((prev) => [...prev, botMessage]);
      }

    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        if (originalMessageIndex === null) { // Only add cancel message for new requests
          const cancelMessage = { id: Date.now() + 1, sender: 'bot', text: 'Generation stopped.', isError: true };
          setMessages((prev) => [...prev, cancelMessage]);
        }
      } else {
        console.error('Error fetching chat response:', error);
        const errorMessage = {
          id: Date.now() + 1,
          sender: 'bot',
          text: error.response?.data?.message || error.message || 'Sorry, something went wrong.',
          isError: true,
        };
        if (originalMessageIndex !== null) {
          // Replace old message with error if regeneration failed
          setMessages(prev => prev.map((msg, index) => index === originalMessageIndex + 1 ? errorMessage : msg));
        } else {
          setMessages((prev) => [...prev, errorMessage]);
        }
      }
    } finally {
      setIsLoading(false);
      setCancelTokenSource(null);
    }
  };

  // Handle submit from input form (always uses fast model initially)
  const handleFormSubmit = (e) => {
    e.preventDefault();
    sendMessage(input, false); // Send with useQuality = false
  };

  // Handle click on suggested prompts (always uses fast model initially)
  const handleSuggestionClick = (prompt) => {
    sendMessage(prompt, false); // Send with useQuality = false
  };

  // Handle click on "Think Deeper" button
  const handleThinkDeeper = (originalUserPrompt, originalBotMessageIndex) => {
    console.log(`Regenerating response for prompt: "${originalUserPrompt}" using quality model.`);
    // Call sendMessage with useQuality = true and the index of the original USER message
    sendMessage(originalUserPrompt, true, originalBotMessageIndex);
  };


  const handleStopGenerating = () => {
    if (cancelTokenSource) {
      cancelTokenSource.cancel('User requested cancellation.');
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messageList}>
        {messages.length === 0 && !isLoading && (
          <SuggestedPrompts onPromptClick={handleSuggestionClick} />
        )}
        {messages.map((msg, index) => (
          <MessageBubble
            key={msg.id || index} // Use unique ID if available
            message={msg}
            index={index} // Pass index
            // Show think deeper if it's a bot message, not an error,
            // was generated by the fast model, and we are not currently loading
            showThinkDeeper={
              msg.sender === 'bot' &&
              !msg.isError &&
              msg.modelUsed === 'QWEN2_1.8B' &&
              !isLoading
            }
            onThinkDeeper={handleThinkDeeper}
            // Pass the original user prompt text and the index of the user message
            originalUserPrompt={msg.originalPrompt}
            originalMessageIndex={index - 1} // Index of the user message is one before the bot message
          />
        ))}

        {isLoading && (
          <div className={styles.typingIndicator}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleFormSubmit} className={styles.inputForm}>
        {isLoading ? (
          <button type="button" className={`${styles.controlButton} ${styles.stopButton}`} onClick={handleStopGenerating}>
            <Square size={20} />
          </button>
        ) : (
          <div style={{ width: "44px" }}></div> // Placeholder for alignment
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