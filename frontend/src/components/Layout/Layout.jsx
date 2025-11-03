import React from 'react';
import Navbar from './Navbar';
import Attribution from './Attribution';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ۱. Navbar یک بار اینجا رندر می‌شود */}
      <Navbar />

      {/* ۲. کانتینر اصلی محتوا */}
      {/* FIX: اعمال max-width و centering
        - w-full: در موبایل تمام صفحه باشد
        - max-w-4xl: حداکثر عرض در دسکتاپ (حل مشکل کشیدگی)
        - mx-auto: وسط‌چین کردن کانتینر
        - flex-1: باعث می‌شود فوتر به پایین صفحه بچسبد
      */}
      <main className="flex-1 flex flex-col w-full max-w-4xl mx-auto p-4">
        {/* 'children' همان کامپوننت HomePage است */}
        {children}
      </main>

      {/* ۳. فوتر */}
      <Attribution />
    </div>
  );
};

export default Layout;