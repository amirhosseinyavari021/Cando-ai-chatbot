import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SuggestedPrompts.module.css';

// این کامپوننت یک تابع به عنوان پراپ دریافت می‌کند تا کلیک را به والد (ChatBox) اطلاع دهد
const SuggestedPrompts = ({ onPromptClick }) => {
  const { t } = useTranslation();

  // ما این کلیدها را در فایل‌های ترجمه اضافه خواهیم کرد
  const prompts = [
    t('prompt1'),
    t('prompt2'),
    t('prompt3'),
  ];

  return (
    <div className={styles.container}>
      <p className={styles.title}>{t('suggested_questions_title')}</p>
      <div className={styles.promptsGrid}>
        {prompts.map((prompt, i) => (
          <button 
            key={i} 
            onClick={() => onPromptClick(prompt)} 
            className={styles.promptButton}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedPrompts;