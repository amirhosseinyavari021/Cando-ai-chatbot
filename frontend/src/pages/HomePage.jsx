// frontend/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../components/Layout/Layout';
import { Header } from '../components/Layout/Header';
// import Sidebar from '../components/Layout/Sidebar'; // <-- حذف شده بود
import { ChatBox } from '../components/Chat/ChatBox';
import { useChat } from '../hooks/useChat';
// FIX: 'detectLanguage' حذف شد چون در utils.js شما وجود ندارد
// import { detectLanguage } from '../lib/utils';
import '../index.css';

const HomePage = () => {
  const {
    messages,
    addMessage,
    isLoading,
    startNewChat,
  } = useChat();

  const { t, i18n } = useTranslation();

  // FIX: این useEffect به طور کامل حذف شد تا خطای بیلد برطرف شود
  // useEffect(() => {
  //   if (messages.length > 0 && messages[0].sender === 'user') {
  //     const lang = detectLanguage(messages[0].content);
  //     if (i18n.language !== lang) {
  //       i18n.changeLanguage(lang);
  //     }
  //   }
  // }, [messages, i18n]);

  return (
    <Layout
    // پراپ‌های سایدبار حذف شده‌اند
    >
      <Header
        // پراپ onToggleSidebar حذف شده است
        onNewChat={startNewChat}
      />
      <ChatBox
        messages={messages}
        onSendMessage={addMessage}
        isLoading={isLoading}
      />
    </Layout>
  );
};

export default HomePage;