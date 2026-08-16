import styles from './Sidebar.module.css';

export function SidebarItem({ icon: Icon, label, isActive, onClick, isCollapsed, badge, isDisabled }) {
  return (
    <button
      className={`${styles.navItem} ${isActive ? styles.activeNavItem : ''} ${isDisabled ? styles.disabledNavItem : ''}`}
      onClick={isDisabled ? undefined : onClick}
      title={isCollapsed ? label : undefined}
      disabled={isDisabled}
    >
      <div className={styles.iconContainer}>
        {Icon && <Icon size={20} color={isActive ? 'var(--color-brand)' : 'var(--color-text-secondary)'} />}
      </div>

      {!isCollapsed && (
        <span className={styles.itemLabel}>
          {label}
        </span>
      )}

      {!isCollapsed && badge && (
        <span className={styles.badge}>
          {badge}
        </span>
      )}
    </button>
  );
}
