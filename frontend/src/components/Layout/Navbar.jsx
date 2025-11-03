import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

const Navbar = () => {
  const { theme } = useTheme();

  return (
    // FIX: هدر چسبان (sticky) با یک خط (border-b) واحد
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border shadow-sm">
      {/* FIX: محتوای Navbar نیز در یک کانتینر max-w-4xl قرار می‌گیرد
        تا دقیقاً با محتوای چت‌باکس زیرین هم‌تراز باشد.
      */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto p-4">
        {/* لوگو */}
        <div className="flex items-center gap-3">
          <img
            src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
            alt="Cando Logo"
            // FIX: تعیین اندازه مشخص برای جلوگیری از CLS
            className="h-8 w-auto"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/logo.png';
            }}
          />
          <span className="font-semibold text-lg text-gray-900 dark:text-white">
            Cando AI
          </span>
        </div>

        {/* کنترل‌ها (تغییر تم) */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;