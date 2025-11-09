/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: "1rem",
        screens: { lg: "768px", xl: "896px", "2xl": "1024px" },
      },
    },
  },
  plugins: [
    // اگر prose می‌خوای:
    require('@tailwindcss/typography'),
  ],
};
