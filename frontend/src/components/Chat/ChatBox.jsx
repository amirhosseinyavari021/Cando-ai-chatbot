import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { sendChatMessage } from '../../api';
import { Send, Paperclip, XCircle } from 'lucide-react'; // Loader2 removed
import styles from './ChatBox.module.css';
import MessageBubble from './MessageBubble';
import SuggestedPrompts from './SuggestedPrompts';

// Helper function to convert file to base64
const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
});

const ChatBox = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [imageBase64, setImageBase64] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (promptText) => {
    if ((!promptText.trim() && !imageBase64) || isLoading) return;

    const userMessage = {
      sender: 'user',
      text: promptText,
      image: imageBase64
    };
    setMessages((prev) => [...prev, userMessage]);

    const currentInput = promptText;
    const currentImage = imageBase64;

    setInput('');
    setImageBase64(null);
    setIsLoading(true);

    try {
      const res = await sendChatMessage(currentInput, currentImage);
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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Basic size check (e.g., limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size exceeds 5MB limit.");
        e.target.value = null; // Clear the input
        return;
      }
      try {
        const base64 = await toBase64(file);
        setImageBase64(base64);
      } catch (err) {
        console.error("Error converting file to base64:", err);
        alert("Failed to process the image file.");
      }
    }
    e.target.value = null; // Reset file input to allow selecting the same file again
  };


  return (
    <div className={styles.chatContainer}>
      <div className={styles.messageList}>
        {messages.length === 0 && !isLoading && (
          <SuggestedPrompts onPromptClick={handleSuggestionClick} />
        )}
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}

        {/* --- نمایش اندیکاتور لودینگ --- */}
        {isLoading && (
          <div className={styles.typingIndicator}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
        )}
        {/* --- پایان اندیکاتور لودینگ --- */}

        <div ref={messagesEndRef} />
      </div>

      {imageBase64 && (
        <div className={styles.imagePreview}>
          <img src={imageBase64} alt="Preview" />
          <button onClick={() => setImageBase64(null)} className={styles.removeImageBtn}>
            <XCircle size={20} />
          </button>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className={styles.inputForm}>
        <input
          type="file"
          accept="image/png, image/jpeg"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          className={styles.attachButton}
          onClick={() => fileInputRef.current.click()}
          disabled={isLoading}
        >
          <Paperclip size={20} />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chat_placeholder')}
          className={styles.inputField}
          disabled={isLoading}
        />
        <button type="submit" className={styles.sendButton} disabled={isLoading || (!input.trim() && !imageBase64)}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;