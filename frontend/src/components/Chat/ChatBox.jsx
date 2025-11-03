import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import Loading from './Loading';
import SuggestedPrompts from './SuggestedPrompts';
import { FiSend } from 'react-icons/fi'; // آیکن ارسال

const ChatBox = () => {
  const { messages, loading, error, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // اسکرول خودکار به پایین
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    // FIX: پس‌زمینه با کنتراست بهتر
    <div className="flex flex-col flex-1 h-full w-full bg-gray-50 dark:bg-dark-card shadow-inner rounded-b-lg">

      {/* لیست پیام‌ها */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}
        {loading && <Loading />}
        <div ref={messagesEndRef} />
      </div>

      {/* پرامپت‌های پیشنهادی (در شروع) */}
      {messages.length === 0 && !loading && (
        <SuggestedPrompts onPromptClick={(prompt) => sendMessage(prompt)} />
      )}

      {/* فرم ورودی چت */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-dark-border">
        {/* FIX: استفاده از flex و gap-2
          در `dir="rtl"`، این چیدمان به طور خودکار معکوس می‌شود:
          دکمه (آیتم دوم) در سمت چپ، ورودی (آیتم اول) در سمت راست.
        */}
        <div className="flex flex-row gap-2">

          {/* ورودی متن */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            // FIX: dir="auto" زبان ورودی (LTR/RTL) را خودکار تشخیص می‌دهد
            dir="auto"
            placeholder="پیام خود را بنویسید..."
            className="flex-1 w-full p-3 px-4
                       border border-gray-300 dark:border-dark-muted 
                       rounded-full 
                       bg-white dark:bg-gray-700
                       text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:outline-none
                       /* FIX: کنتراست Placeholder و ارتفاع خط (حل مشکل برش‌خوردگی) */
                       placeholder-gray-500 dark:placeholder-dark-muted
                       leading-6"
            disabled={loading}
          />

          {/* دکمه ارسال */}
          <button
            type="submit"
            // FIX: A11y - لیبل برای Screen Reader
            aria-label="ارسال پیام"
            title="ارسال پیام"
            disabled={loading}
            // FIX: p-3 برای Hit Area بزرگتر و flex-shrink-0 برای جلوگیری از کوچک شدن
            className="flex-shrink-0 p-3 
                       text-white 
                       bg-blue-600 
                       rounded-full 
                       hover:bg-blue-700 
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {/* FIX: حل مشکل آینه نشدن آیکن
              کلاس `rtl:scale-x-[-1]` به طور خودکار آیکن را در حالت RTL می‌چرخاند.
            */}
            <FiSend size={20} className="rtl:transform rtl:scale-x-[-1]" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;