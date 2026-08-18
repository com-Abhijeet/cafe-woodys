import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Utensils, Receipt } from 'lucide-react';
import styles from './TableWorkspaceModal.module.css';

export function SubmittedOrdersList({ orders, unbilledFoodTotal }) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Estimate GST (5% standard food tax) for live bill preview banner
  const estTaxPaise = Math.round(unbilledFoodTotal * 0.05);
  const estGrandTotalPaise = unbilledFoodTotal + estTaxPaise;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-surface)' }}>
      {/* 1. Header */}
      <button className={styles.pastOrdersHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Utensils size={16} color="var(--color-brand)" />
          <span style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--color-brand)' }}>
            Unbilled Orders Submitted This Visit ({orders.length})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 800, fontSize: 'var(--text-xs)', color: 'var(--color-brand)' }}>
            Subtotal: ₹{(unbilledFoodTotal / 100).toFixed(2)}
          </span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '8px 12px 12px 12px' }}>
          {orders.length === 0 ? (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '24px 0', flex: 1 }}>
              No orders submitted yet for this table visit.
            </div>
          ) : (
            <>
              {/* 2. Scrollable Individual Order Tickets Area */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                {orders.map((ord, idx) => {
                  const orderSubtotalPaise = ord.items.reduce((sum, i) => sum + (i.priceSnapshot * i.quantity), 0);
                  const orderNumber = orders.length - idx;

                  return (
                    <div key={ord.id} style={{ backgroundColor: 'var(--color-bg)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)', marginBottom: '6px' }}>
                        <span>Batch Order #{orderNumber}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)', fontSize: '10px' }}>
                          <Clock size={10} /> {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Dish Line Items */}
                      {ord.items.map((i) => (
                        <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', marginTop: '3px' }}>
                          <span>{i.quantity}x {i.menuItem?.name || 'Item'}</span>
                          <span>₹{((i.priceSnapshot * i.quantity) / 100).toFixed(2)}</span>
                        </div>
                      ))}

                      {/* Individual Order Subtotal at bottom of order card */}
                      <div style={{ borderTop: '1px dashed var(--color-border)', marginTop: '6px', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)' }}>
                        <span>Order #{orderNumber} Subtotal:</span>
                        <span>₹{(orderSubtotalPaise / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 3. Pinned Cumulative Food Bill Preview Banner at Very Bottom */}
              <div style={{
                backgroundColor: 'rgba(107, 63, 42, 0.08)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--color-brand)',
                marginTop: '8px',
                flexShrink: 0,
                boxShadow: '0 -2px 6px rgba(0,0,0,0.04)'
              }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-brand)', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Receipt size={14} /> Cumulative Food Bill Preview
                  </span>
                  <span>{orders.length} Batch Ticket(s)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  <span>Combined Food Subtotal:</span>
                  <span>₹{(unbilledFoodTotal / 100).toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  <span>Est. GST (5%):</span>
                  <span>₹{(estTaxPaise / 100).toFixed(2)}</span>
                </div>

                <div style={{ borderTop: '1px solid rgba(107, 63, 42, 0.3)', marginTop: '6px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-brand)' }}>
                  <span>Estimated Total Food Bill:</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800 }}>₹{(estGrandTotalPaise / 100).toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
