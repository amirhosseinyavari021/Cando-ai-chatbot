import { useTranslation } from 'react-i18next';
import styles from './Navbar.module.css';
import ThemeToggle from '../ThemeToggle/ThemeToggle'; // Ensure ThemeToggle is imported

// Read version from Vite's environment variables
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
          {/* Ensure logo path is correct */}
          <img src="/logo.png" alt="Cando Logo" className={styles.logo} />
          {/* Container for title and version */}
          <div className={styles.titleVersion}>
            <h1>{t('navbar_title')}</h1>
            {/* Display version if available */}
            {appVersion && <span className={styles.version}>v{appVersion}</span>}
          </div>
        </div>

        {/* Ensure this container and its children are present */}
        <div className={styles.controlsArea}>
          <ThemeToggle /> {/* Theme toggle button */}
          <button onClick={toggleLanguage} className={styles.langToggle}>
            {i18n.language === 'en' ? 'فارسی' : 'English'} {/* Language toggle button */}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;