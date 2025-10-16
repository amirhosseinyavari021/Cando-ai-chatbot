import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEN from './locales/en/translation.json';
import translationFA from './locales/fa/translation.json';

const resources = {
  en: {
    translation: translationEN,
  },
  fa: {
    translation: translationFA,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // Default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

// This effect updates the <html> tag's dir and lang attributes
i18n.on('languageChanged', (lng) => {
  document.body.dir = i18n.dir(lng);
  document.documentElement.lang = lng;
});

export default i18n;