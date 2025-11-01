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

const updateDocumentLanguage = (lng) => {
  if (typeof document === 'undefined') return;
  document.body.dir = i18n.dir(lng);
  document.documentElement.lang = lng;
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'fa', // پیش‌فرض: فارسی
  fallbackLng: 'fa',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

// Ensure initial attributes match the default language
updateDocumentLanguage(i18n.language);

// This effect updates the <html> tag's dir and lang attributes
i18n.on('languageChanged', (lng) => {
  updateDocumentLanguage(lng);
});

export default i18n;
