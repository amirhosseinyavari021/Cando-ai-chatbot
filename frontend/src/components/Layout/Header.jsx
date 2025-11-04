// frontend/src/components/Layout/Header.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Plus } from 'lucide-react';
import styles from './Navbar.module.css'; // Using Navbar styles for consistency
import { Button } from '../ui/Button';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
// FIX: Import path removed, as the file doesn't exist at that path
// import CandoLogo from '../../assets/cando-logo.svg'; 

// FIX: Use the correct logo path from the /public folder
const CandoLogo = '/logo.png';

/**
 * Header component displayed at the top of the main chat window.
 * (REWRITTEN: Removed sidebar toggle)
 *
 * @param {function} onNewChat - Function to start a new chat.
 */
export const Header = ({ onNewChat }) => {
  // FIX: onToggleSidebar prop removed
  const { t } = useTranslation();

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        {/* FIX: Sidebar Toggle Button Removed */}
        {/*
        <button className={styles.menuButton} onClick={onToggleSidebar}>
          <Menu size={20} />
        </button>
        */}

        {/* Cando Logo */}
        {/* We add a specific style to 'fix' the margin left by the missing button */}
        <img src={CandoLogo} alt="Cando Logo" className={`${styles.logo} ${styles.logoNoSidebar}`} />
      </div>

      <div className={styles.center}>
        {/* Title or other center elements can go here */}
        {/* <h1 className={styles.title}>{t('Cando AI Assistant')}</h1> */}
      </div>

      <div className={styles.right}>
        {/* New Chat Button */}
        <Button variant="ghost" size="icon" onClick={onNewChat} className={styles.newChatButton}
          aria-label={t('New Chat')}
        >
          <Plus size={20} />
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
};