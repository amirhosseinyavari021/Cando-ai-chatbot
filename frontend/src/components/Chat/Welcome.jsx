import React from 'react';
import { useTranslation } from 'react-i18next';

const Welcome = ({ onSendSuggestion }) => {
  const { t } = useTranslation();
  
  // Example suggestions (can be moved to i18n)
  const suggestions = [
    t('suggestion1'),
    t('suggestion2'),
    t('suggestion3'),
    t('suggestion4'),
  ];

  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <img src="/logo.png" alt="Cando Logo" className="w-20 h-20 mb-4" />
      <h2 className="text-2xl font-semibold mb-2">{t('welcomeTitle')}</h2>
      <p className="text-muted-foreground mb-8">{t('welcomeSubtitle')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {suggestions.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSendSuggestion(prompt)}
            className="p-4 bg-card border border-border rounded-lg text-sm text-right hover:bg-secondary transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Welcome;