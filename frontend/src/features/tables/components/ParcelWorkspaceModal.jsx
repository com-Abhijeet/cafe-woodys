import { useState } from 'react';
import { useMenu } from '../../menu/hooks/useMenu';
import { submitParcelOrderApi } from '../../orders/api/orders.api';
import { CategorySidebar } from './CategorySidebar';
import { MenuItemGrid } from './MenuItemGrid';
import { OrderTabs } from './OrderTabs';
import { BillPreview } from './BillPreview';
import { Button } from '../../../components/ui/Button/Button';
import { X, ShoppingBag, Eye } from 'lucide-react';
import styles from './TableWorkspaceModal.module.css';

export function ParcelWorkspaceModal({ onClose, onRefreshTable }) {
  const [workspaceView, setWorkspaceView] = useState('ORDERING');
  const { items: menuItems, isLoading: isMenuLoading } = useMenu();

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [submittedParcelOrder, setSubmittedParcelOrder] = useState(null);

  const categories = Array.from(new Set(menuItems.map((m) => m.category))).filter(Boolean);
  const filteredMenuItems = selectedCategory === 'ALL'
    ? menuItems.filter((m) => m.isAvailable)
    : menuItems.filter((m) => m.isAvailable && m.category === selectedCategory);

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

  const handleSubmitParcelOrder = async () => {
    if (cart.length === 0) return;
    setActionError('');
    setIsSubmitting(true);

    const itemsPayload = cart.map((c) => ({
      menuItemId: c.menuItem.id,
      quantity: c.quantity
    }));

    try {
      const createdOrder = await submitParcelOrderApi(itemsPayload);
      setCart([]);
      setSubmittedParcelOrder(createdOrder);
      if (onRefreshTable) onRefreshTable();
    } catch (err) {
      setActionError(err.message || 'Failed to submit parcel order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parcelTableData = {
    id: submittedParcelOrder ? submittedParcelOrder.id : null,
    name: submittedParcelOrder ? `Order #${submittedParcelOrder.dailyOrderNumber}` : 'New Takeaway',
    zone: { name: 'PARCEL / TAKEAWAY' },
    orderType: 'PARCEL'
  };

  return (
    <div className={styles.fullScreenOverlay}>
      {workspaceView === 'BILLING' && submittedParcelOrder ? (
        <BillPreview
          table={parcelTableData}
          onBackToOrdering={() => setWorkspaceView('ORDERING')}
          onRefreshTable={onRefreshTable}
        />
      ) : (
        <>
          {/* Header */}
          <div className={styles.workspaceHeader}>
            <div className={styles.tableTitleGroup}>
              <h2 className={styles.tableName} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={22} color="var(--color-primary)" /> New Parcel / Takeaway Order
              </h2>
              <span
                className={styles.zoneBadge}
                style={{ backgroundColor: 'rgba(39, 174, 96, 0.15)', color: 'var(--color-success)' }}
              >
                Takeaway Counter
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              {submittedParcelOrder && (
                <Button onClick={() => setWorkspaceView('BILLING')}>
                  <Eye size={16} /> View Parcel Bill Preview
                </Button>
              )}
              <button className={styles.closeBtn} onClick={onClose} title="Close Parcel Order">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Main Body */}
          <div className={styles.workspaceBody}>
            <CategorySidebar
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              totalItemsCount={menuItems.length}
            />

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
            </div>

            <div className={styles.cartPanel} style={{ padding: 0 }}>
              <OrderTabs
                cart={cart}
                onUpdateCartQty={handleUpdateCartQty}
                onSubmitOrder={handleSubmitParcelOrder}
                isSubmitting={isSubmitting}
                orders={submittedParcelOrder ? [submittedParcelOrder] : []}
                unbilledFoodTotal={cart.reduce((sum, c) => sum + (c.menuItem.price * c.quantity), 0)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
