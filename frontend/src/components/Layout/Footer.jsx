import { useTranslation } from 'react-i18next';
import styles from './Footer.module.css';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className={styles.footer}>
      <div className="container">
        <p>
          {t('footer_created_by_part1')}{' '}
          <strong className={styles.yellowText}>{t('name_amirhossein')}</strong>{' '}
          {t('footer_created_by_part2')}{' '}
          <strong className={styles.yellowText}>{t('name_cando')}</strong>.
        </p>
        <p>
          {t('footer_dedicated_to_part1')}{' '}
          <strong className={styles.yellowText}>{t('name_cando')}</strong>.
        </p>
      </div>
    </footer>
  );
};

export default Footer;