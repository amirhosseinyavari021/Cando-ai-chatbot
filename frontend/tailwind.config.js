/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // فعال‌سازی دارک مود بر اساس کلاس
  theme: {
    extend: {
      fontFamily: {
        // FIX: تعریف فونت فارسی به عنوان فونت پیش‌فرض
        // 'font-sans' کلاسی است که به صورت پیش‌فرض اعمال می‌شود.
        sans: ['Vazirmatn', 'sans-serif'],
      },
      // FIX: تعریف رنگ‌های کنتراست‌پذیر برای دارک مود
      // برای حل مشکل کنتراست پایین اسکلت‌لودر و متن.
      colors: {
        'dark-bg': '#111827', // پس‌زمینه اصلی تیره (مثل gray-900)
        'dark-card': '#1C2536', // پس‌زمینه کارت‌ها (مثل gray-800)
        'dark-muted': '#4B5563', // متن Placeholder (مثل gray-600)
        'dark-border': '#374151', // مرزها (مثل gray-700)
      }
    },
  },
  plugins: [],
}