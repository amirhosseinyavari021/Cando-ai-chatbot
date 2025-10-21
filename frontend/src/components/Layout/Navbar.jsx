import { useTranslation } from 'react-i18next';
import styles from './Navbar.module.css';
import ThemeToggle from '../ThemeToggle/ThemeToggle'; // <-- ۱. ایمپورت تاگل تم
const appVersion = import.meta.env.PACKAGE_VERSION;
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
          <div className={styles.titleVersion}>
            <h1>{t('navbar_title')}</h1>
            {/* Displays the version read from env */}
            {appVersion && <span className={styles.version}>v{appVersion}</span>}
          </div>
        </div>
        {/* ... controls ... */}
      </div>
    </nav>
  );
};
export default Navbar;