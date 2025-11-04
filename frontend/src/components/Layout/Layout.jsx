// frontend/src/components/Layout/Layout.jsx
import React, { useState } from 'react';
import styles from './Layout.module.css';
import Attribution from './Attribution';

/**
 * Main application layout component.
 * (REWRITTEN: Removed sidebar logic)
 * It creates the overall structure for the main content area.
 * @param {React.ReactNode} children - The main content (e.g., Header + ChatBox).
 */
export const Layout = ({ children }) => {
  // FIX: Removed all props and state related to sidebar
  // ({ sidebar, children, isSidebarOpen, onToggleSidebar })
  // const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // FIX: handleMobileToggle removed

  return (
    <div className={styles.layout}>
      {/* --- Sidebar Removed --- */}
      {/* <aside className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarClosed : ''}`}>
        {sidebar}
      </aside>
      */}

      {/* --- Mobile Sidebar (Overlay) Removed --- */}

      {/* --- Main Content Area --- */}
      <div className={styles.contentWrapper}>
        {/* Note: The Header is part of the `children` prop, 
          rendered from HomePage.jsx.
        */}
        <main className={styles.mainContent}>
          {children}
        </main>

        {/* Attribution (Footer) */}
        <Attribution />
      </div>
    </div>
  );
};