import { useState } from 'react';
import { OrderCart } from './OrderCart';
import { SubmittedOrdersList } from './SubmittedOrdersList';
import { ShoppingCart, Utensils, ChevronRight } from 'lucide-react';

export function OrderTabs({
  cart,
  onUpdateCartQty,
  onSubmitOrder,
  isSubmitting,
  orders,
  unbilledFoodTotal,
  onRefreshOrders
}) {
  const [activeOrderTab, setActiveOrderTab] = useState('CART');

  const cartItemCount = cart.reduce((s, c) => s + c.quantity, 0);
  const cartSubtotalPaise = cart.reduce((sum, c) => sum + (c.menuItem.price * c.quantity), 0);

  const handleSubmitAndSwitch = async () => {
    await onSubmitOrder();
    setActiveOrderTab('HISTORY');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 1. Tab Selector Header */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        flexShrink: 0
      }}>
        <button
          onClick={() => setActiveOrderTab('CART')}
          style={{
            flex: 1,
            padding: '10px 8px',
            border: 'none',
            borderBottom: activeOrderTab === 'CART' ? '2px solid var(--color-brand)' : '2px solid transparent',
            backgroundColor: activeOrderTab === 'CART' ? 'rgba(107, 63, 42, 0.08)' : 'transparent',
            color: activeOrderTab === 'CART' ? 'var(--color-brand)' : 'var(--color-text-secondary)',
            fontWeight: 800,
            fontSize: 'var(--text-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <ShoppingCart size={14} /> Building Order ({cartItemCount})
        </button>

        <button
          onClick={() => setActiveOrderTab('HISTORY')}
          style={{
            flex: 1,
            padding: '10px 8px',
            border: 'none',
            borderBottom: activeOrderTab === 'HISTORY' ? '2px solid var(--color-brand)' : '2px solid transparent',
            backgroundColor: activeOrderTab === 'HISTORY' ? 'rgba(107, 63, 42, 0.08)' : 'transparent',
            color: activeOrderTab === 'HISTORY' ? 'var(--color-brand)' : 'var(--color-text-secondary)',
            fontWeight: 800,
            fontSize: 'var(--text-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Utensils size={14} /> Order History ({orders.length})
        </button>
      </div>

      {/* 2. Compact Inactive Summary Bar */}
      {activeOrderTab === 'CART' ? (
        <div
          onClick={() => setActiveOrderTab('HISTORY')}
          style={{
            backgroundColor: 'var(--color-bg)',
            borderBottom: '1px solid var(--color-border)',
            padding: '6px 12px',
            fontSize: '11px',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          <span>Submitted History: <strong>{orders.length} order(s)</strong> (₹{(unbilledFoodTotal / 100).toFixed(2)})</span>
          <span style={{ color: 'var(--color-brand)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
            View <ChevronRight size={12} />
          </span>
        </div>
      ) : (
        <div
          onClick={() => setActiveOrderTab('CART')}
          style={{
            backgroundColor: 'var(--color-bg)',
            borderBottom: '1px solid var(--color-border)',
            padding: '6px 12px',
            fontSize: '11px',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          <span>Current Draft Cart: <strong>{cartItemCount} item(s)</strong> (₹{(cartSubtotalPaise / 100).toFixed(2)})</span>
          <span style={{ color: 'var(--color-brand)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
            Build Cart <ChevronRight size={12} />
          </span>
        </div>
      )}

      {/* 3. Active Tab Content Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {activeOrderTab === 'CART' ? (
          <OrderCart
            cart={cart}
            onUpdateCartQty={onUpdateCartQty}
            onSubmitOrder={handleSubmitAndSwitch}
            isSubmitting={isSubmitting}
          />
        ) : (
          <SubmittedOrdersList
            orders={orders}
            unbilledFoodTotal={unbilledFoodTotal}
            onRefreshOrders={onRefreshOrders}
          />
        )}
      </div>
    </div>
  );
}
