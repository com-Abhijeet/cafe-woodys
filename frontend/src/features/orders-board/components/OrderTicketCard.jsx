import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { EntityCard } from '../../../components/ui/EntityCard';
import { formatKitchenStatus } from '../../../lib/labels';
import { Clock, ChevronDown, ChevronUp, Play, CheckCircle2, BellRing, AlertTriangle, Undo2 } from 'lucide-react';
import styles from './OrderTicketCard.module.css';

export function OrderTicketCard({ order, onAdvanceStatus, onCancelOrder }) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
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
  const canUndo60s = elapsedSecsTotal <= 60 && status === 'PENDING' && (role === 'WAITER' || role === 'ADMIN');

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

  const totalItemCount = (order.items || []).reduce((sum, i) => sum + i.quantity, 0);

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
      title={`${order.table?.name || 'Table'} Ticket`}
      subtitle={`Staff: ${order.staff?.username || 'Staff'} • ${order.customer ? order.customer.name : 'Walk-in'}`}
      badgeText={isDelayed ? '⚠️ DELAYED (>10m)' : formatKitchenStatus(status)}
      badgeVariant={getBadgeVariant(status)}
      onClick={() => setIsExpanded(!isExpanded)}
      footerLeft={
        <span style={{ fontSize: 'var(--text-xs)', color: isDelayed ? 'var(--color-danger)' : 'var(--color-text-secondary)', fontWeight: isDelayed ? 800 : 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> {elapsedText}
        </span>
      }
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)' }}>
        <span>{totalItemCount} Dish Line Item(s)</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>

      {isExpanded && order.items?.length > 0 && (
        <div className={styles.itemsList}>
          {order.items.map((i) => (
            <div key={i.id} className={styles.itemRow}>
              <span><strong>{i.quantity}x</strong> {i.menuItem?.name || 'Dish'}</span>
              <span>₹{((i.priceSnapshot * i.quantity) / 100).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {actionButton}

      {/* 60s Undo Window for Just-Submitted Order */}
      {canUndo60s && onCancelOrder && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Undo & cancel this just-submitted order?')) {
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
          <Undo2 size={12} /> Undo Order ({60 - elapsedSecsTotal}s left)
        </button>
      )}
    </EntityCard>
  );
}
