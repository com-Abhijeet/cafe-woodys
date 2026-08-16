import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getDefaultTabForRole } from '../../config/sidebarConfig';
import { AppShell } from './AppShell';
import { TableGrid } from '../../features/tables/components/TableGrid';
import { OrdersBoard } from '../../features/orders-board/components/OrdersBoard';
import { ZoneTableManager } from '../../features/zones/components/ZoneTableManager';
import { MenuManager } from '../../features/menu/components/MenuManager';
import { InventoryManager } from '../../features/inventory/components/InventoryManager';
import { PurchaseManager } from '../../features/purchases/components/PurchaseManager';
import { CustomerCRMManager } from '../../features/customers/components/CustomerCRMManager';
import { PaymentsManager } from '../../features/payments/components/PaymentsManager';
import { BillsHistoryManager } from '../../features/billing/components/BillsHistoryManager';
import { StaffManager } from '../../features/auth/components/StaffManager';
import { Settings, Users } from 'lucide-react';

export function MainLayout() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => getDefaultTabForRole(user?.role));
  const [settingsSubTab, setSettingsSubTab] = useState('ZONES'); // 'ZONES' | 'STAFF'

  return (
    <AppShell activeTab={activeTab} onSelectTab={setActiveTab}>
      {activeTab === 'FLOOR' && <TableGrid />}
      {activeTab === 'ORDERS_BOARD' && <OrdersBoard />}
      {activeTab === 'MENU' && <MenuManager />}
      {activeTab === 'INVENTORY' && <InventoryManager />}
      {activeTab === 'PURCHASES' && <PurchaseManager />}
      {activeTab === 'CUSTOMERS' && <CustomerCRMManager />}
      {activeTab === 'PAYMENTS' && <PaymentsManager />}
      {activeTab === 'BILLS' && <BillsHistoryManager />}
      
      {/* Settings View (Zones/Tables Config & Staff Management) */}
      {activeTab === 'SETTINGS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
            <button
              onClick={() => setSettingsSubTab('ZONES')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: settingsSubTab === 'ZONES' ? 'rgba(107, 63, 42, 0.12)' : 'transparent',
                color: settingsSubTab === 'ZONES' ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                fontWeight: 700,
                fontSize: 'var(--text-sm)',
                cursor: 'pointer'
              }}
            >
              <Settings size={16} /> Zones & Tables Configuration
            </button>

            <button
              onClick={() => setSettingsSubTab('STAFF')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: settingsSubTab === 'STAFF' ? 'rgba(107, 63, 42, 0.12)' : 'transparent',
                color: settingsSubTab === 'STAFF' ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                fontWeight: 700,
                fontSize: 'var(--text-sm)',
                cursor: 'pointer'
              }}
            >
              <Users size={16} /> Staff & User Accounts
            </button>
          </div>

          {settingsSubTab === 'ZONES' && <ZoneTableManager />}
          {settingsSubTab === 'STAFF' && <StaffManager />}
        </div>
      )}
    </AppShell>
  );
}
