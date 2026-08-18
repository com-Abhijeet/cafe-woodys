import { useState } from 'react';
import { getMobilePrimarySections, getMobileMoreSections } from '../../config/sidebarConfig';
import { useNotification } from '../../context/NotificationContext';
import { MoreSheet } from './MoreSheet';
import {
  LayoutGrid,
  ChefHat,
  UserCheck,
  CreditCard,
  Receipt,
  MoreHorizontal
} from 'lucide-react';

const ICON_MAP = {
  FLOOR: { label: 'Tables', icon: LayoutGrid },
  ORDERS_BOARD: { label: 'Orders', icon: ChefHat },
  CUSTOMERS: { label: 'Customers', icon: UserCheck },
  PAYMENTS: { label: 'Payments', icon: CreditCard },
  BILLS: { label: 'Bills', icon: Receipt },
};

export function BottomNav({ activeTab, onSelectTab, role = 'ADMIN' }) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const primarySections = getMobilePrimarySections(role);
  const moreSections = getMobileMoreSections(role);

  let liveBadge = null;
  try {
    const { liveBadgeCount } = useNotification();
    if (liveBadgeCount > 0) liveBadge = liveBadgeCount;
  } catch (err) {
    // context optional
  }

  const isMoreActive = moreSections.includes(activeTab);

  return (
    <>
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 999,
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.08)'
      }}>
        {primarySections.map((key) => {
          const item = ICON_MAP[key];
          if (!item) return null;
          const Icon = item.icon;
          const isActive = activeTab === key;

          return (
            <button
              key={key}
              onClick={() => onSelectTab(key)}
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '10px',
                cursor: 'pointer',
                flex: 1,
                padding: '6px 0',
                position: 'relative'
              }}
            >
              <div style={{ position: 'relative' }}>
                <Icon size={20} color={isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)'} />
                {key === 'ORDERS_BOARD' && liveBadge && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-8px',
                    backgroundColor: 'var(--color-danger)',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 800,
                    borderRadius: '10px',
                    padding: '1px 5px',
                    lineHeight: 1
                  }}>
                    {liveBadge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}

        {moreSections.length > 0 && (
          <button
            onClick={() => setIsMoreOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              color: isMoreActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: isMoreActive ? 700 : 500,
              fontSize: '10px',
              cursor: 'pointer',
              flex: 1,
              padding: '6px 0'
            }}
          >
            <MoreHorizontal size={20} color={isMoreActive ? 'var(--color-primary)' : 'var(--color-text-secondary)'} />
            <span>More</span>
          </button>
        )}
      </nav>

      <MoreSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        moreSections={moreSections}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
      />
    </>
  );
}
