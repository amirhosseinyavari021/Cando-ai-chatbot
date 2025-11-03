import React from 'react';
import ChatBox from '../components/Chat/ChatBox';
import TopNotice from '../components/Chat/TopNotice';

// این کامپوننت *توسط* App.jsx *داخل* Layout رندر می‌شود
const HomePage = () => {
  return (
    // flex-1 باعث می‌شود چت‌باکس ارتفاع باقی‌مانده را پر کند
    <div className="flex flex-col flex-1 w-full">
      {/* FIX: بنر اکنون داخل کانتینر max-width قرار دارد و هم‌تراز است */}
      <TopNotice />

      {/* ChatBox تمام فضای باقی‌مانده را می‌گیرد */}
      <ChatBox />
    </div>
  );
};

export default HomePage;