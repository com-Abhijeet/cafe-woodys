import { useState, lazy, Suspense } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getDefaultTabForRole } from '../../config/sidebarConfig';
import { AppShell } from './AppShell';

// Eagerly loaded core views for instantaneous floor grid & live order board loads
import { TableGrid } from '../../features/tables/components/TableGrid';
import { OrdersBoard } from '../../features/orders-board/components/OrdersBoard';

// Lazy-loaded heavy modules — code split into separate dynamic bundle chunks
const MenuManager = lazy(() => import('../../features/menu/components/MenuManager').then(m => ({ default: m.MenuManager })));
const InventoryManager = lazy(() => import('../../features/inventory/components/InventoryManager').then(m => ({ default: m.InventoryManager })));
const PurchaseManager = lazy(() => import('../../features/purchases/components/PurchaseManager').then(m => ({ default: m.PurchaseManager })));
const CustomerCRMManager = lazy(() => import('../../features/customers/components/CustomerCRMManager').then(m => ({ default: m.CustomerCRMManager })));
const PaymentsManager = lazy(() => import('../../features/payments/components/PaymentsManager').then(m => ({ default: m.PaymentsManager })));
const BillsHistoryManager = lazy(() => import('../../features/billing/components/BillsHistoryManager').then(m => ({ default: m.BillsHistoryManager })));
const ActiveBillsPage = lazy(() => import('../../features/billing/components/ActiveBillsPage').then(m => ({ default: m.ActiveBillsPage })));
const SettingsManager = lazy(() => import('../../features/settings/components/SettingsManager').then(m => ({ default: m.SettingsManager })));
const PrintLogsScreen = lazy(() => import('../../features/settings/components/PrintLogsScreen').then(m => ({ default: m.PrintLogsScreen })));
const ReportsDashboard = lazy(() => import('../../features/reports/components/ReportsDashboard').then(m => ({ default: m.ReportsDashboard })));
const DaybookPage = lazy(() => import('../../features/daybook/DaybookPage'));
const CustomerBalancesPage = lazy(() => import('../../features/customers/AllBalancesPage'));
const SupplierBalancesPage = lazy(() => import('../../features/suppliers/AllBalancesPage'));
const CustomerLedgerPage = lazy(() => import('../../features/customers/CustomerLedgerPage'));
const SupplierLedgerPage = lazy(() => import('../../features/suppliers/SupplierLedgerPage'));

export function MainLayout() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => getDefaultTabForRole(user?.role));
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);

  const handleOpenCustomerLedger = (customerId) => {
    setSelectedCustomerId(customerId);
    setActiveTab('CUSTOMER_LEDGER');
  };

  const handleOpenSupplierLedger = (supplierId) => {
    setSelectedSupplierId(supplierId);
    setActiveTab('SUPPLIER_LEDGER');
  };

  return (
    <AppShell activeTab={activeTab} onSelectTab={setActiveTab}>
      <Suspense fallback={
        <div style={{ padding: '40px', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
          Loading view chunk...
        </div>
      }>
        {activeTab === 'FLOOR' && <TableGrid />}
        {activeTab === 'ORDERS_BOARD' && <OrdersBoard />}
        {activeTab === 'ACTIVE_BILLS' && <ActiveBillsPage />}
        {activeTab === 'MENU' && <MenuManager />}
        {activeTab === 'INVENTORY' && <InventoryManager />}
        {activeTab === 'PURCHASES' && <PurchaseManager onOpenBalances={() => setActiveTab('SUPPLIER_BALANCES')} onOpenLedger={handleOpenSupplierLedger} />}
        {activeTab === 'CUSTOMERS' && <CustomerCRMManager onOpenBalances={() => setActiveTab('CUSTOMER_BALANCES')} onOpenLedger={handleOpenCustomerLedger} />}
        {activeTab === 'DAYBOOK' && <DaybookPage />}
        {activeTab === 'CUSTOMER_BALANCES' && <CustomerBalancesPage onSelectCustomer={handleOpenCustomerLedger} />}
        {activeTab === 'SUPPLIER_BALANCES' && <SupplierBalancesPage onSelectSupplier={handleOpenSupplierLedger} />}
        {activeTab === 'CUSTOMER_LEDGER' && <CustomerLedgerPage customerId={selectedCustomerId} onBack={() => setActiveTab('CUSTOMERS')} />}
        {activeTab === 'SUPPLIER_LEDGER' && <SupplierLedgerPage supplierId={selectedSupplierId} onBack={() => setActiveTab('PURCHASES')} />}
        {activeTab === 'PAYMENTS' && <PaymentsManager />}
        {activeTab === 'BILLS' && <BillsHistoryManager />}
        {activeTab === 'REPORTS' && <ReportsDashboard />}
        {activeTab === 'SETTINGS' && <SettingsManager />}
        {activeTab === 'PRINT_LOGS' && <PrintLogsScreen />}
      </Suspense>
    </AppShell>
  );
}
