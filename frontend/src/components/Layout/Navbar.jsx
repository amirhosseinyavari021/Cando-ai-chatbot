import { useTranslation } from 'react-i18next';
import styles from './Navbar.module.css';

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
          {/* Replace 'logo.png' with your actual "Lego Cando" logo.
            Put the logo in the /frontend/public/ directory.
          */}
          <img src="/logo.png" alt="Cando Logo" className={styles.logo} />
          <h1>{t('navbar_title')}</h1>
        </div>
        
        <button onClick={toggleLanguage} className={styles.langToggle}>
          {i18n.language === 'en' ? 'فارسی' : 'English'}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;