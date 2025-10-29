import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Loading.module.css';

const Loading = ({ fallbackTriggered }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.loadingContainer}>
      <img src="/logo.png" alt="Cando Logo" className={styles.logo} />
      <div className={styles.spinner}></div>
      {fallbackTriggered && (
        <span className={styles.fallbackText}>
          {'در حال سوییچ به مسیر پشتیبان…'}
        </span>
      )}
      {!fallbackTriggered && (
         <span className={styles.loadingText}>
          {'در حال پردازش...'}
         </span>
      )}
    </div>
  );
};

export default Loading;