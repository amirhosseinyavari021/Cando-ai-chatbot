import { useTranslation } from 'react-i18next';
import styles from './Navbar.module.css';
import ThemeToggle from '../ThemeToggle/ThemeToggle'; // <-- ۱. ایمپورت تاگل تم

const Navbar = () => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fa' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <nav className={styles.navbar}>
      <div className={`${styles.navContent} container`}>
        <div className={styles.logoArea}>
          <img src="/logo.png" alt="Cando Logo" className={styles.logo} />
          <h1>{t('navbar_title')}</h1>
        </div>

        {/* ۲. اضافه کردن تاگل‌ها به نوبار */}
        <div className={styles.controlsArea}>
          <ThemeToggle />
          <button onClick={toggleLanguage} className={styles.langToggle}>
            {i18n.language === 'en' ? 'فارسی' : 'English'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;