// frontend/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../components/Layout/Layout';
import { Header } from '../components/Layout/Header';
// import Sidebar from '../components/Layout/Sidebar'; // <-- حذف شده بود
// FIX: ایمپورت از حالت { ChatBox } به ChatBox تغییر کرد تا با export default مطابقت داشته باشد
import ChatBox from '../components/Chat/ChatBox';
import { useChat } from '../hooks/useChat';
// FIX: 'detectLanguage' حذف شده بود
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

  // FIX: useEffect مربوط به detectLanguage حذف شده بود
  // useEffect(() => {
  //   ...
  // }, [messages, i18n]);

  return (
    <Layout
    // پراپ‌های سایدبار حذف شده‌اند
    >
      <Header
        // پراپ onToggleSidebar حذف شده است
        onNewChat={startNewChat}
      />
      {/* FIX: کامپوننت ChatBox اکنون به درستی رندر می‌شود */}
      <ChatBox
        messages={messages}
        onSendMessage={addMessage} // FIX: پراپ onSendMessage پاس داده شد
        isLoading={isLoading}
      />
    </Layout>
  );
};

export default HomePage;