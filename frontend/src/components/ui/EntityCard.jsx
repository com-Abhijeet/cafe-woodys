import { ChevronRight } from 'lucide-react';
import styles from './EntityCard.module.css';

export function EntityCard({
  title,
  subtitle,
  badgeText,
  badgeVariant = 'default', // 'success' | 'danger' | 'warning' | 'info' | 'default'
  children,
  footerLeft,
  onClick,
  showChevron = true
}) {
  const getBadgeStyle = () => {
    switch (badgeVariant) {
      case 'success':
        return { color: 'var(--color-success)', backgroundColor: 'rgba(46, 125, 79, 0.12)' };
      case 'danger':
        return { color: 'var(--color-danger)', backgroundColor: 'rgba(196, 57, 43, 0.12)' };
      case 'warning':
        return { color: 'var(--color-warning)', backgroundColor: 'rgba(211, 84, 0, 0.12)' };
      case 'info':
        return { color: 'var(--color-brand)', backgroundColor: 'rgba(107, 63, 42, 0.12)' };
      default:
        return { color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg)' };
    }
  };

  return (
    <div className={styles.card} onClick={onClick}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <h3 className={styles.title}>{title}</h3>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>

        {badgeText && (
          <span className={styles.badge} style={getBadgeStyle()}>
            {badgeText}
          </span>
        )}
      </div>

      {/* Body Slot */}
      {children && <div className={styles.cardBody}>{children}</div>}

      {/* Footer */}
      {(footerLeft || showChevron) && (
        <div className={styles.cardFooter}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>
            {footerLeft}
          </div>
          {showChevron && <ChevronRight size={18} className={styles.chevron} />}
        </div>
      )}
    </div>
  );
}
