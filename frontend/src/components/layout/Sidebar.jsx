import { SidebarItem } from './SidebarItem';
import { isSectionVisibleForRole } from '../../config/sidebarConfig';
import { useNotification } from '../../context/NotificationContext';
import {
  LayoutGrid,
  ChefHat,
  Utensils,
  Package,
  Truck,
  UserCheck,
  CreditCard,
  ReceiptText,
  Receipt,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import styles from './Sidebar.module.css';

export function Sidebar({ activeTab, onSelectTab, role = 'ADMIN', isCollapsed, onToggleCollapse }) {
  const isVisible = (key) => isSectionVisibleForRole(key, role);
  let liveBadge = null;

  try {
    const { liveBadgeCount } = useNotification();
    if (liveBadgeCount > 0) liveBadge = liveBadgeCount;
  } catch (err) {
    // fallback if context not ready
  }

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsedSidebar : ''}`}>
      {/* Header / Brand & Toggle */}
      <div className={styles.sidebarHeader}>
        {!isCollapsed && (
          <div className={styles.brand}>
            <h1 className={styles.brandTitle}>Café Woody's</h1>
            <span style={{ fontSize: '10px', backgroundColor: 'var(--color-brand)', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
              POS
            </span>
          </div>
        )}

        <button className={styles.toggleBtn} onClick={onToggleCollapse} title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}>
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className={styles.navContainer}>
        {/* 1. Floor Grid */}
        {isVisible('FLOOR') && (
          <SidebarItem
            icon={LayoutGrid}
            label="Floor Grid"
            isActive={activeTab === 'FLOOR'}
            onClick={() => onSelectTab('FLOOR')}
            isCollapsed={isCollapsed}
          />
        )}

        {/* 2. Kitchen & Live Orders Kanban Board */}
        {isVisible('ORDERS_BOARD') && (
          <SidebarItem
            icon={ChefHat}
            label="Orders Board"
            isActive={activeTab === 'ORDERS_BOARD'}
            onClick={() => onSelectTab('ORDERS_BOARD')}
            isCollapsed={isCollapsed}
            badge={liveBadge}
          />
        )}

        {/* 2b. Active Unbilled Orders */}
        {isVisible('ACTIVE_BILLS') && (
          <SidebarItem
            icon={ReceiptText}
            label="Active Bills"
            isActive={activeTab === 'ACTIVE_BILLS'}
            onClick={() => onSelectTab('ACTIVE_BILLS')}
            isCollapsed={isCollapsed}
          />
        )}

        {/* 3. Menu & Recipes */}
        {isVisible('MENU') && (
          <SidebarItem
            icon={Utensils}
            label="Menu & Recipes"
            isActive={activeTab === 'MENU'}
            onClick={() => onSelectTab('MENU')}
            isCollapsed={isCollapsed}
          />
        )}

        {/* 4. Raw Material Inventory */}
        {isVisible('INVENTORY') && (
          <SidebarItem
            icon={Package}
            label="Inventory"
            isActive={activeTab === 'INVENTORY'}
            onClick={() => onSelectTab('INVENTORY')}
            isCollapsed={isCollapsed}
          />
        )}

        {/* 5. Purchases & Suppliers */}
        {isVisible('PURCHASES') && (
          <SidebarItem
            icon={Truck}
            label="Purchases"
            isActive={activeTab === 'PURCHASES'}
            onClick={() => onSelectTab('PURCHASES')}
            isCollapsed={isCollapsed}
          />
        )}

        {/* 6. Customers CRM */}
        {isVisible('CUSTOMERS') && (
          <SidebarItem
            icon={UserCheck}
            label="Customers CRM"
            isActive={activeTab === 'CUSTOMERS'}
            onClick={() => onSelectTab('CUSTOMERS')}
            isCollapsed={isCollapsed}
          />
        )}

        {/* 7. Payments Reconciliation */}
        {isVisible('PAYMENTS') && (
          <SidebarItem
            icon={CreditCard}
            label="Payments Log"
            isActive={activeTab === 'PAYMENTS'}
            onClick={() => onSelectTab('PAYMENTS')}
            isCollapsed={isCollapsed}
          />
        )}

        {/* 8. Bill History */}
        {isVisible('BILLS') && (
          <SidebarItem
            icon={Receipt}
            label="Bill History"
            isActive={activeTab === 'BILLS'}
            onClick={() => onSelectTab('BILLS')}
            isCollapsed={isCollapsed}
          />
        )}

        {/* 9. Reports & Analytics Dashboard */}
        {isVisible('REPORTS') && (
          <SidebarItem
            icon={BarChart3}
            label="Reports & Analytics"
            isActive={activeTab === 'REPORTS'}
            onClick={() => onSelectTab('REPORTS')}
            isCollapsed={isCollapsed}
          />
        )}

        {/* 10. Settings (Admin Only) */}
        {isVisible('SETTINGS') && (
          <SidebarItem
            icon={Settings}
            label="Settings & Staff"
            isActive={activeTab === 'SETTINGS'}
            onClick={() => onSelectTab('SETTINGS')}
            isCollapsed={isCollapsed}
          />
        )}
      </div>

      {/* Footer Info */}
      <div className={styles.sidebarFooter}>
        {!isCollapsed && (
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textAlign: 'center', fontWeight: 600 }}>
            Café Woody's POS • v1.0.0
          </div>
        )}
      </div>
    </aside>
  );
}
