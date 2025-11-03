import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import faTranslation from './locales/fa/translation.json';
import enTranslation from './locales/en/translation.json';

// The logic for detecting language from browser/localStorage is removed.
// We are now Persian-first.

const resources = {
  en: {
    translation: enTranslation,
  },
  fa: {
    translation: faTranslation,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'fa', // Hardcode default language to Farsi
  fallbackLng: 'fa', // Fallback to Farsi
  debug: process.env.NODE_ENV === 'development', // Enable debug only in dev

  interpolation: {
    escapeValue: false, // React already does escaping
  },
});

export default i18n;