import React from 'react';
import styles from './Navbar.module.css';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../ThemeToggle/ThemeToggle'; // Assuming this was here

const Navbar = () => {
  const { theme } = useTheme();

  // Any { t, i18n } = useTranslation(); and related logic has been REMOVED.
  // The language toggle button/dropdown has been REMOVED.

  return (
    <nav
      className={`${styles.navbar} bg-gray-100 dark:bg-gray-900 shadow-md`}
    >
      <div className={styles.navContainer}>
        <div className={styles.logo}>
          <img
            src={
              theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'
            } // Assuming you have different logos
            alt="Cando Logo"
            className={styles.logoImg}
            onError={(e) => { e.target.src = '/logo.png' }} // Fallback logo
          />
          <span className={styles.logoText}>Cando AI</span>
        </div>

        <div className={styles.navLinks}>
          {/* Other nav links would go here */}
        </div>

        <div className={styles.navControls}>
          <ThemeToggle />
          {/* The Language Toggle component is no longer here. */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;