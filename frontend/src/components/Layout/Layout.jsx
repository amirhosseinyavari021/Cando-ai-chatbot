import Navbar from './Navbar';
// Footer removed
import Attribution from './Attribution'; // Renamed Footer component
import styles from './Layout.module.css';

const Layout = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Navbar />
      <main className={styles.mainContent}>{children}</main>
      {/* Attribution added here, below the main chat content */}
      <Attribution />
    </div>
  );
};

export default Layout;