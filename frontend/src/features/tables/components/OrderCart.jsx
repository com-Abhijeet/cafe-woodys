import { Button } from '../../../components/ui/Button/Button';
import { ShoppingCart, Plus, Minus, Send } from 'lucide-react';
import styles from './TableWorkspaceModal.module.css';

export function OrderCart({ cart, onUpdateCartQty, onSubmitOrder, isSubmitting }) {
  const subtotalPaise = cart.reduce((sum, c) => sum + (c.menuItem.price * c.quantity), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, padding: 'var(--space-3)', boxSizing: 'border-box', flex: 1, backgroundColor: 'var(--color-surface)' }}>
      <div className={styles.cartHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShoppingCart size={18} color="var(--color-brand)" />
          <span style={{ fontWeight: 800, fontSize: 'var(--text-sm)', color: 'var(--color-brand)' }}>
            Current Order Batch
          </span>
        </div>
        <span className={styles.cartBadge}>{cart.reduce((s, c) => s + c.quantity, 0)} Items</span>
      </div>

      {cart.length === 0 ? (
        <div className={styles.emptyCartBox}>
          Cart is empty. Tap items from the menu grid to build an order.
        </div>
      ) : (
        <div className={styles.cartItemsList}>
          {cart.map((c) => (
            <div key={c.menuItem.id} className={styles.cartRow}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)' }}>{c.menuItem.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                  ₹{(c.menuItem.price / 100).toFixed(2)} each
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className={styles.cartQtyStepper}>
                  <button className={styles.cartQtyBtn} onClick={() => onUpdateCartQty(c.menuItem.id, -1)}>-</button>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800 }}>{c.quantity}</span>
                  <button className={styles.cartQtyBtn} onClick={() => onUpdateCartQty(c.menuItem.id, 1)}>+</button>
                </div>
                <span style={{ fontWeight: 800, fontSize: 'var(--text-xs)', color: 'var(--color-brand)' }}>
                  ₹{((c.menuItem.price * c.quantity) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Total & Submit */}
      <div className={styles.cartFooter}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: 'var(--text-sm)' }}>
          <span>Subtotal:</span>
          <span style={{ fontSize: 'var(--text-lg)', color: 'var(--color-brand)' }}>₹{(subtotalPaise / 100).toFixed(2)}</span>
        </div>

        <Button
          onClick={onSubmitOrder}
          disabled={cart.length === 0 || isSubmitting}
          fullWidth
          style={{ marginTop: '8px' }}
        >
          <Send size={16} /> {isSubmitting ? 'Submitting Order...' : 'Submit Batch Order'}
        </Button>
      </div>
    </div>
  );
}
