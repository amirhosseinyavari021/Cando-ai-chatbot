import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { sendChatMessage } from '../../api';
import { Send, Loader2 } from 'lucide-react';
import styles from './ChatBox.module.css';
import MessageBubble from './MessageBubble';
import SuggestedPrompts from './SuggestedPrompts'; // <-- 1. ایمپورت کامپوننت جدید

const ChatBox = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 2. این تابع اصلاح شد تا متن پرامپت را به عنوان ورودی بگیرد
  const handleSubmit = async (promptText) => {
    if (!promptText.trim() || isLoading) return;

    const userMessage = { sender: 'user', text: promptText };
    setMessages((prev) => [...prev, userMessage]);
    setInput(''); // ورودی را همیشه پاک کن
    setIsLoading(true);

    try {
      const res = await sendChatMessage(promptText); // از متنی که دریافت کرده استفاده کن
      const botMessage = { sender: 'bot', text: res.data.response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error fetching chat response:', error);
      const errorMessage = {
        sender: 'bot',
        text: error.response?.data?.message || 'Sorry, something went wrong.',
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. یک تابع جدا برای ارسال فرم
  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(input);
  };

  // 4. تابع جدید برای کلیک روی سوالات پیشنهادی
  const handleSuggestionClick = (prompt) => {
    handleSubmit(prompt);
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messageList}>
        {/* 5. نمایش سوالات پیشنهادی فقط اگر پیامی وجود ندارد */}
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

      <form onSubmit={handleFormSubmit} className={styles.inputForm}>
        <input
          type="text"
          value={input}
          // 6. رفع باگ: e.g.target.value به e.target.value تغییر کرد
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chat_placeholder')}
          className={styles.inputField}
          disabled={isLoading}
        />
        <button type="submit" className={styles.sendButton} disabled={isLoading}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;