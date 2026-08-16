import { ChevronRight } from 'lucide-react';
import styles from './ListRow.module.css';

export function ListRow({
  title,
  subtitle,
  badgeText,
  badgeVariant = 'default',
  fields = [],
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
    <div className={styles.row} onClick={onClick}>
      {/* Title & Subtitle */}
      <div className={styles.primarySection}>
        <h4 className={styles.title}>{title}</h4>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>

      {/* Structured Fields Columns */}
      {fields.length > 0 && (
        <div className={styles.fieldsSection}>
          {fields.map((field, idx) => (
            <div key={idx} className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>{field.label}</span>
              <span className={styles.fieldValue}>{field.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Right Badge & Action Chevron */}
      <div className={styles.rightSection}>
        {badgeText && (
          <span className={styles.badge} style={getBadgeStyle()}>
            {badgeText}
          </span>
        )}
        {showChevron && <ChevronRight size={18} className={styles.chevron} />}
      </div>
    </div>
  );
}
