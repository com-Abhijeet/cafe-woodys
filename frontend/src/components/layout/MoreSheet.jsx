import {
  Utensils,
  Package,
  Truck,
  UserCheck,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  X,
  Info
} from 'lucide-react';
import styles from './MoreSheet.module.css';

const TAB_CONFIG = {
  MENU: { label: 'Menu & Recipes', icon: Utensils },
  INVENTORY: { label: 'Inventory', icon: Package },
  PURCHASES: { label: 'Purchases', icon: Truck },
  CUSTOMERS: { label: 'Customers CRM', icon: UserCheck },
  PAYMENTS: { label: 'Payments Log', icon: CreditCard },
  BILLS: { label: 'Bill History', icon: Receipt },
  REPORTS: { label: 'Reports & Analytics', icon: BarChart3 },
  SETTINGS: { label: 'Settings & Staff', icon: Settings },
};

export function MoreSheet({ isOpen, onClose, moreSections, activeTab, onSelectTab }) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>More Management Sections</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.grid}>
          {moreSections.map((key) => {
            const conf = TAB_CONFIG[key];
            if (!conf) return null;
            const Icon = conf.icon;
            const isActive = activeTab === key;

            return (
              <button
                key={key}
                className={`${styles.itemBtn} ${isActive ? styles.activeItem : ''}`}
                onClick={() => {
                  onSelectTab(key);
                  onClose();
                }}
              >
                <Icon size={18} color={isActive ? 'var(--color-primary)' : 'var(--color-brand)'} />
                <span>{conf.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
