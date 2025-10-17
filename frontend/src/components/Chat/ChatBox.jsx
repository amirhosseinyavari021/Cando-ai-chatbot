import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { sendChatMessage } from '../../api';
// آیکون‌های جدید برای آپلود و حذف
import { Send, Loader2, Paperclip, XCircle } from 'lucide-react';
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
  const [imageBase64, setImageBase64] = useState(null); // State for image
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null); // Ref for hidden file input

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (promptText) => {
    if ((!promptText.trim() && !imageBase64) || isLoading) return;

    const userMessage = {
      sender: 'user',
      text: promptText,
      image: imageBase64 // ارسال تصویر به حباب پیام
    };
    setMessages((prev) => [...prev, userMessage]);

    const currentInput = promptText;
    const currentImage = imageBase64;

    setInput('');
    setImageBase64(null); // پاک کردن تصویر
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

  // مدیریت انتخاب فایل
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await toBase64(file);
      setImageBase64(base64);
    }
    e.target.value = null; // ریست کردن اینپوت فایل
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
        {isLoading && (
          <div className={styles.typingIndicator}>
            <Loader2 className={styles.spinner} />
            <span>CandoBot is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* بخش جدید پیش‌نمایش تصویر */}
      {imageBase64 && (
        <div className={styles.imagePreview}>
          <img src={imageBase64} alt="Preview" />
          <button onClick={() => setImageBase64(null)} className={styles.removeImageBtn}>
            <XCircle size={20} />
          </button>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className={styles.inputForm}>
        {/* اینپوت مخفی فایل */}
        <input
          type="file"
          accept="image/png, image/jpeg"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {/* دکمه پیوست کردن */}
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