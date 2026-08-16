import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Utensils } from 'lucide-react';
import styles from './TableWorkspaceModal.module.css';

export function SubmittedOrdersList({ orders, unbilledFoodTotal }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={styles.pastOrdersBox}>
      <button className={styles.pastOrdersHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Utensils size={16} color="var(--color-brand)" />
          <span style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--color-brand)' }}>
            Unbilled Orders Submitted This Visit ({orders.length})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 800, fontSize: 'var(--text-xs)', color: 'var(--color-brand)' }}>
            ₹{(unbilledFoodTotal / 100).toFixed(2)}
          </span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isExpanded && (
        <div style={{ padding: '8px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
          {orders.length === 0 ? (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              No orders submitted yet for this visit.
            </div>
          ) : (
            orders.map((ord, idx) => (
              <div key={ord.id} style={{ backgroundColor: 'var(--color-surface)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                  <span>Order #{orders.length - idx}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={10} /> {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {ord.items.map((i) => (
                  <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginTop: '2px' }}>
                    <span>{i.quantity}x {i.menuItem?.name || 'Item'}</span>
                    <span>₹{((i.priceSnapshot * i.quantity) / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
