import { useTranslation } from 'react-i18next';
import styles from './Attribution.module.css'; // Rename CSS import

const Attribution = () => { // Rename component
    const { t } = useTranslation();

    return (
        // No separate footer tag, just a div with text
        <div className={styles.attribution}>
            <div className="container">
                <p>
                    {t('footer_created_by_part1')}{' '}
                    {/* Use the new themed color class */}
                    <strong className={styles.themedName}>{t('name_amirhossein')}</strong>{' '}
                    {t('footer_created_by_part2')}{' '}
                    <strong className={styles.themedName}>{t('name_cando')}</strong>.
                </p>
                <p>
                    {t('footer_dedicated_to_part1')}{' '}
                    <strong className={styles.themedName}>{t('name_cando')}</strong>.
                </p>
            </div>
        </div>
    );
};

export default Attribution; // Export renamed component