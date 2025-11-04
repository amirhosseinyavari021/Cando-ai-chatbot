// frontend/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../components/Layout/Layout';
import { Header } from '../components/Layout/Header';
// FIX: Sidebar import removed
// import Sidebar from '../components/Layout/Sidebar';
import { ChatBox } from '../components/Chat/ChatBox';
import { useChat } from '../hooks/useChat';
import { detectLanguage } from '../lib/utils';
import '../index.css';

const HomePage = () => {
  const {
    messages,
    addMessage,
    isLoading,
    startNewChat,
    // FIX: Removed persistence-related props
    // currentConversationId,
    // conversations,
    // loadConversation,
    // fetchConversations,
  } = useChat();

  const { t, i18n } = useTranslation();

  // FIX: Sidebar state removed
  // const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // FIX: Removed useEffect for loading conversations
  // useEffect(() => {
  //   fetchConversations();
  // }, [fetchConversations]);

  // Change i18n language based on the first message
  useEffect(() => {
    if (messages.length > 0 && messages[0].sender === 'user') {
      const lang = detectLanguage(messages[0].content);
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang);
      }
    }
  }, [messages, i18n]);

  // FIX: handleConversationSelect removed
  // const handleConversationSelect = (convoId) => {
  //   loadConversation(convoId);
  // };

  return (
    <Layout
    // FIX: All sidebar props removed
    // sidebar={
    //   <Sidebar
    //     conversations={conversations}
    //     onNewChat={startNewChat}
    //     onConversationSelect={handleConversationSelect}
    //     activeConversationId={currentConversationId}
    //   />
    // }
    // isSidebarOpen={isSidebarOpen}
    // onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
    >
      <Header
        // FIX: onToggleSidebar prop removed
        // onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
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