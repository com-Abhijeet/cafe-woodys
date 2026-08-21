import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useBusinessProfile } from '../../settings/hooks/useBusinessProfile';
import { formatKitchenStatus } from '../../../lib/labels';
import { Clock, Play, CheckCircle2, BellRing, Undo2 } from 'lucide-react';
import styles from './OrderTicketCard.module.css';

export function OrderTicketCard({ order, onAdvanceStatus, onCancelOrder }) {
  const { user } = useAuth();
  const { profile } = useBusinessProfile();
  const [elapsedText, setElapsedText] = useState('');
  const [elapsedMins, setElapsedMins] = useState(0);
  const [elapsedSecsTotal, setElapsedSecsTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Elapsed Time Ticker
  useEffect(() => {
    const updateElapsed = () => {
      const created = new Date(order.createdAt).getTime();
      const now = new Date().getTime();
      const diffMs = Math.max(0, now - created);
      const totalSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffMs / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);

      setElapsedMins(diffMins);
      setElapsedSecsTotal(totalSecs);

      if (diffMins < 1) {
        setElapsedText(`${diffSecs}s ago`);
      } else {
        setElapsedText(`${diffMins}m ${diffSecs}s ago`);
      }
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [order.createdAt]);

  const role = user?.role || 'WAITER';
  const status = order.kitchenStatus || 'PENDING';
  const isDelayed = (status === 'PENDING' || status === 'PREPARING') && elapsedMins >= 10;
  
  const cancellationWindowSecs = profile?.orderCancellationWindowSeconds ?? 300;
  const canUndo = elapsedSecsTotal <= cancellationWindowSecs && status === 'PENDING' && (role === 'WAITER' || role === 'ADMIN' || role === 'COUNTER');

  let actionButton = null;

  const handleAction = async (e) => {
    e.stopPropagation();
    let nextStatus = null;
    if (status === 'PENDING') nextStatus = 'PREPARING';
    else if (status === 'PREPARING') nextStatus = 'READY';
    else if (status === 'READY') nextStatus = 'SERVED';

    if (!nextStatus) return;

    setIsSubmitting(true);
    try {
      await onAdvanceStatus(order.id, nextStatus);
    } catch (err) {
      // error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  if (role === 'KITCHEN' || role === 'ADMIN') {
    if (status === 'PENDING') {
      actionButton = (
        <button
          className={`${styles.actionBtn} ${styles.btnPreparing}`}
          onClick={handleAction}
          disabled={isSubmitting}
        >
          <Play size={14} /> {isSubmitting ? 'Updating...' : 'Start Cooking'}
        </button>
      );
    } else if (status === 'PREPARING') {
      actionButton = (
        <button
          className={`${styles.actionBtn} ${styles.btnReady}`}
          onClick={handleAction}
          disabled={isSubmitting}
        >
          <CheckCircle2 size={14} /> {isSubmitting ? 'Updating...' : 'Mark Ready'}
        </button>
      );
    }
  }

  if (role === 'WAITER' || role === 'COUNTER' || role === 'ADMIN') {
    if (status === 'READY') {
      actionButton = (
        <button
          className={`${styles.actionBtn} ${styles.btnServed}`}
          onClick={handleAction}
          disabled={isSubmitting}
        >
          <BellRing size={14} /> {isSubmitting ? 'Updating...' : 'Mark Served'}
        </button>
      );
    }
  }

  const isParcel = order.orderType === 'PARCEL' || !order.tableId;
  const locationLabel = isParcel
    ? 'PARCEL / TAKEAWAY'
    : (order.table?.name ? `Table ${order.table.name}` : 'Table');

  // Step 6: Dine-in vs Parcel shown via left-border color accent
  const leftBorderColor = isParcel ? '#27ae60' : '#6B3F2A';

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        borderLeft: `5px solid ${leftBorderColor}`,
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        height: 'auto', // Step 6: Height fits content, not a fixed size
        boxShadow: 'var(--shadow-card)'
      }}
    >
      {/* Header: Order Number (Primary, Largest Element) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-brand)', lineHeight: 1.1 }}>
            Order #{order.dailyOrderNumber || order.id.slice(-4).toUpperCase()}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, marginTop: '2px' }}>
            {locationLabel} • {order.staff?.username || 'Staff'}
          </div>
        </div>

        {/* Status Badge */}
        <span
          style={{
            fontSize: '10px',
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            backgroundColor: isDelayed ? 'rgba(196,57,43,0.15)' : status === 'READY' ? 'rgba(39,174,96,0.15)' : status === 'PREPARING' ? 'rgba(41,128,185,0.15)' : 'rgba(230,126,34,0.15)',
            color: isDelayed ? 'var(--color-danger)' : status === 'READY' ? 'var(--color-success)' : status === 'PREPARING' ? 'var(--color-info)' : 'var(--color-warning)'
          }}
        >
          {isDelayed ? '⚠️ DELAYED (>10m)' : formatKitchenStatus(status)}
        </span>
      </div>

      {/* Phase 20 Step 5: Inline Kitchen Prep Item List (NO prices on Order Tracker screen) */}
      <div style={{ borderTop: '1px dashed var(--color-border)', borderBottom: '1px dashed var(--color-border)', padding: '6px 0', margin: '2px 0' }}>
        {order.items?.filter((i) => !i.voidedAt).map((i) => (
          <div key={i.id} style={{ fontSize: 'var(--text-xs)', padding: '2px 0', color: 'var(--color-text-primary)', fontWeight: 500 }}>
            <strong style={{ color: 'var(--color-brand)' }}>{i.quantity}x</strong> {i.menuItem?.name || 'Dish'}
          </div>
        ))}
      </div>

      {/* Footer: Timer & Action Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
        <span style={{ fontSize: '11px', color: isDelayed ? 'var(--color-danger)' : 'var(--color-text-secondary)', fontWeight: isDelayed ? 800 : 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> {elapsedText}
        </span>

        {actionButton}
      </div>

      {/* Undo Order Window */}
      {canUndo && onCancelOrder && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Undo & cancel this order?')) {
              onCancelOrder(order.id);
            }
          }}
          style={{
            marginTop: '4px',
            background: 'none',
            border: 'none',
            color: 'var(--color-danger)',
            fontSize: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            width: '100%',
            justifyContent: 'center'
          }}
        >
          <Undo2 size={12} /> Undo Order ({cancellationWindowSecs - elapsedSecsTotal}s left)
        </button>
      )}
    </div>
  );
}
