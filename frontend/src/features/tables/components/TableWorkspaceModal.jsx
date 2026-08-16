import { useState } from 'react';
import { useMenu } from '../../menu/hooks/useMenu';
import { useOrders } from '../../orders/hooks/useOrders';
import { useBilling } from '../../billing/hooks/useBilling';
import { CategorySidebar } from './CategorySidebar';
import { MenuItemGrid } from './MenuItemGrid';
import { OrderCart } from './OrderCart';
import { PlayerSessionsPanel } from './PlayerSessionsPanel';
import { SubmittedOrdersList } from './SubmittedOrdersList';
import { CheckoutModal } from '../../billing/components/CheckoutModal';
import { Button } from '../../../components/ui/Button/Button';
import { X, Receipt, Utensils, Gamepad2 } from 'lucide-react';
import styles from './TableWorkspaceModal.module.css';

export function TableWorkspaceModal({ table, onClose, onRefreshTable }) {
  const isGaming = table.zone?.type === 'GAMING';

  // Active Workspace Tab: 'ORDER' | 'GAMING'
  const [activeModalTab, setActiveModalTab] = useState('ORDER');

  const { items: menuItems, isLoading: isMenuLoading } = useMenu();
  const { orders, unbilledFoodTotal, submitOrder } = useOrders(table.id);
  const { createBill } = useBilling();

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [activeCheckoutBill, setActiveCheckoutBill] = useState(null);

  const categories = Array.from(new Set(menuItems.map((m) => m.category))).filter(Boolean);
  const filteredMenuItems = selectedCategory === 'ALL'
    ? menuItems.filter((m) => m.isAvailable)
    : menuItems.filter((m) => m.isAvailable && m.category === selectedCategory);

  const hasUnbilledContent = orders.length > 0 || (table.activePlayersCount && table.activePlayersCount > 0);

  // Cart Handlers
  const handleAddToCart = (menuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.menuItem.id === menuItem.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  };

  const handleUpdateCartQty = (menuItemId, delta) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.menuItem.id === menuItemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean);
    });
  };

  const handleSubmitBatchOrder = async () => {
    if (cart.length === 0) return;
    setActionError('');
    setIsSubmitting(true);

    const itemsPayload = cart.map((c) => ({
      menuItemId: c.menuItem.id,
      quantity: c.quantity
    }));

    try {
      await submitOrder(itemsPayload);
      setCart([]);
      if (onRefreshTable) onRefreshTable();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateBill = async () => {
    setActionError('');
    setIsSubmitting(true);
    try {
      const bill = await createBill(table.id);
      setActiveCheckoutBill(bill);
      if (onRefreshTable) onRefreshTable();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.fullScreenOverlay}>
      {/* 1. Header */}
      <div className={styles.workspaceHeader}>
        <div className={styles.tableTitleGroup}>
          <h2 className={styles.tableName}>{table.name} Workspace</h2>
          <span
            className={styles.zoneBadge}
            style={{
              backgroundColor: isGaming ? 'rgba(59, 110, 201, 0.15)' : 'rgba(201, 122, 59, 0.15)',
              color: isGaming ? 'var(--color-gaming-zone)' : 'var(--color-cafe-zone)'
            }}
          >
            {table.zone?.name || (isGaming ? 'Gaming Zone' : 'Café Zone')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {hasUnbilledContent && (
            <Button onClick={handleGenerateBill} disabled={isSubmitting}>
              <Receipt size={16} /> Checkout & Generate Bill
            </Button>
          )}
          <button className={styles.closeBtn} onClick={onClose} title="Close Workspace">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* 2. Top Modal Workspace Tabs */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabBtn} ${activeModalTab === 'ORDER' ? styles.activeTabBtn : ''}`}
          onClick={() => setActiveModalTab('ORDER')}
        >
          <Utensils size={16} /> Food & Drinks Order Taking
        </button>

        {isGaming && (
          <button
            className={`${styles.tabBtn} ${activeModalTab === 'GAMING' ? styles.activeTabBtn : ''}`}
            onClick={() => setActiveModalTab('GAMING')}
          >
            <Gamepad2 size={16} /> Gaming Sessions ({table.activePlayersCount || 0} Seated)
          </button>
        )}
      </div>

      {/* 3. Main Workspace View based on Active Tab */}
      {activeModalTab === 'ORDER' ? (
        <div className={styles.workspaceBody}>
          {/* Left: Category Sidebar */}
          <CategorySidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            totalItemsCount={menuItems.length}
          />

          {/* Center: Menu Grid & Bottom Orders List */}
          <div className={styles.centerArea}>
            {actionError && (
              <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)', backgroundColor: 'rgba(196,57,43,0.1)', padding: '8px 12px', margin: '8px 16px 0 16px', borderRadius: '6px' }}>
                {actionError}
              </div>
            )}

            <div className={styles.menuGridArea}>
              <MenuItemGrid
                menuItems={filteredMenuItems}
                cart={cart}
                onAddToCart={handleAddToCart}
                onUpdateCartQty={handleUpdateCartQty}
                isLoading={isMenuLoading}
              />
            </div>

            {/* Bottom Accordion: Past Submitted Orders for this visit */}
            <div className={styles.bottomPanels}>
              <SubmittedOrdersList
                orders={orders}
                unbilledFoodTotal={unbilledFoodTotal}
              />
            </div>
          </div>

          {/* Right: Running Cart for Current Batch */}
          <OrderCart
            cart={cart}
            onUpdateCartQty={handleUpdateCartQty}
            onSubmitOrder={handleSubmitBatchOrder}
            isSubmitting={isSubmitting}
          />
        </div>
      ) : (
        /* Dedicated Gaming Sessions View */
        <div className={styles.gamingTabBody}>
          <PlayerSessionsPanel
            table={table}
            onRefreshTable={onRefreshTable}
          />
        </div>
      )}

      {/* Checkout Modal Overlay */}
      {activeCheckoutBill && (
        <CheckoutModal
          bill={activeCheckoutBill}
          table={table}
          onClose={() => setActiveCheckoutBill(null)}
          onRefreshTable={onRefreshTable}
        />
      )}
    </div>
  );
}
