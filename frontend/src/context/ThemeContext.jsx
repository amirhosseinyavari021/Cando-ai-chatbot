import React, { createContext, useState, useEffect, useContext } from 'react';

// ۱. ایجاد کانتکست
const ThemeContext = createContext();

// ۲. ایجاد پروایدر
export const ThemeProvider = ({ children }) => {
  // ۳. مدیریت وضعیت تم، با مقدار پیش‌فرض 'dark'
  const [theme, setTheme] = useState('dark');

  // ۴. افکت برای اعمال تم به body
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // ۵. تابع برای تغییر تم
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ۶. هوک (Hook) سفارشی برای استفاده آسان
export const useTheme = () => useContext(ThemeContext);