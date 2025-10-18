import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { sendChatMessage } from '../../api';
// Paperclip and XCircle removed
import { Send } from 'lucide-react';
import styles from './ChatBox.module.css';
import MessageBubble from './MessageBubble';
import SuggestedPrompts from './SuggestedPrompts';

// toBase64 function removed

const ChatBox = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  // imageBase64 state removed
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  // fileInputRef removed

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (promptText) => {
    // Check only for promptText and isLoading
    if (!promptText.trim() || isLoading) return;

    // image removed from userMessage
    const userMessage = {
      sender: 'user',
      text: promptText,
    };
    setMessages((prev) => [...prev, userMessage]);

    const currentInput = promptText;
    // currentImage removed

    setInput('');
    // setImageBase64(null) removed
    setIsLoading(true);

    try {
      // Call sendChatMessage without image parameter
      const res = await sendChatMessage(currentInput);
      const botMessage = { sender: 'bot', text: res.data.response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error fetching chat response:', error);
      const errorMessage = {
        sender: 'bot',
        text: error.response?.data?.message || error.message || 'Sorry, something went wrong.',
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(input);
  };

  const handleSuggestionClick = (prompt) => {
    handleSubmit(prompt);
  };

  // handleFileChange function removed

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messageList}>
        {messages.length === 0 && !isLoading && (
          <SuggestedPrompts onPromptClick={handleSuggestionClick} />
        )}
        {messages.map((msg, index) => (
          // MessageBubble no longer needs image prop implicitly
          <MessageBubble key={index} message={msg} />
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

      {/* Image preview section removed */}

      <form onSubmit={handleFormSubmit} className={styles.inputForm}>
        {/* File input and attach button removed */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chat_placeholder')}
          className={styles.inputField}
          disabled={isLoading}
        />
        {/* Send button disable logic simplified */}
        <button type="submit" className={styles.sendButton} disabled={isLoading || !input.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;