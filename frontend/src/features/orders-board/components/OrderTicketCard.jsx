import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useBusinessProfile } from '../../settings/hooks/useBusinessProfile';
import { EntityCard } from '../../../components/ui/EntityCard';
import { formatKitchenStatus } from '../../../lib/labels';
import { Clock, Play, CheckCircle2, BellRing, Undo2, ShoppingBag } from 'lucide-react';
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
  
  // cancellation window from profile settings or default 300s
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
    ? '🛍️ PARCEL / TAKEAWAY'
    : `Table ${order.table?.name || 'Table'}`;

  const headlineTitle = order.dailyOrderNumber
    ? `Order #${order.dailyOrderNumber}`
    : locationLabel;

  const getBadgeVariant = (st) => {
    if (isDelayed) return 'danger';
    switch (st) {
      case 'READY': return 'success';
      case 'PREPARING': return 'info';
      case 'SERVED': return 'default';
      case 'PENDING': default: return 'warning';
    }
  };

  return (
    <EntityCard
      title={headlineTitle}
      subtitle={`${locationLabel} • ${order.staff?.username || 'Staff'}`}
      badgeText={isDelayed ? '⚠️ DELAYED (>10m)' : formatKitchenStatus(status)}
      badgeVariant={getBadgeVariant(status)}
      footerLeft={
        <span style={{ fontSize: 'var(--text-xs)', color: isDelayed ? 'var(--color-danger)' : 'var(--color-text-secondary)', fontWeight: isDelayed ? 800 : 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> {elapsedText}
        </span>
      }
    >
      {/* Inline Dish Items List (always visible without needing tap) */}
      <div className={styles.itemsList} style={{ marginTop: '4px' }}>
        {order.items?.filter((i) => !i.voidedAt).map((i) => (
          <div key={i.id} className={styles.itemRow} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', padding: '2px 0' }}>
            <span><strong>{i.quantity}x</strong> {i.menuItem?.name || 'Dish'}</span>
            <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>₹{((i.priceSnapshot * i.quantity) / 100).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {actionButton}

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
            marginTop: '6px',
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
    </EntityCard>
  );
}
