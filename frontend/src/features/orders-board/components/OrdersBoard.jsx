import { useState } from 'react';
import { useOrdersBoard } from '../hooks/useOrdersBoard';
import { useAuth } from '../../../hooks/useAuth';
import { boardColumnConfig } from '../config/boardConfig';
import { OrderTicketCard } from './OrderTicketCard';
import { Button } from '../../../components/ui/Button/Button';
import { KITCHEN_STATUS_COLUMN_TITLES, formatKitchenStatus } from '../../../lib/labels';
import { ChefHat, RefreshCw, Volume2, VolumeX, Bell, Sunset, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import styles from './OrdersBoard.module.css';

export function OrdersBoard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const role = user?.role || 'WAITER';

  const {
    orders,
    isLoading,
    error,
    isMuted,
    toggleSound,
    toastMessage,
    refreshOrders,
    advanceKitchenStatus,
    cancelOrder,
    closeDay
  } = useOrdersBoard();

  // Step 9: Role-Based Board Priority (Kitchen collapses READY and SERVED by default)
  const roleConfig = boardColumnConfig[role] || boardColumnConfig.WAITER;
  const [expandedSecondaryCols, setExpandedSecondaryCols] = useState({});

  // Close Day Confirmation & Warning State
  const [unresolvedData, setUnresolvedData] = useState(null);
  const [isClosingDay, setIsClosingDay] = useState(false);
  const [closeSuccessToast, setCloseSuccessToast] = useState(null);

  const pendingOrders = orders.filter((o) => (o.kitchenStatus || 'PENDING') === 'PENDING');
  const preparingOrders = orders.filter((o) => o.kitchenStatus === 'PREPARING');
  const readyOrders = orders.filter((o) => o.kitchenStatus === 'READY');
  const servedOrders = orders.filter((o) => o.kitchenStatus === 'SERVED');

  const columns = [
    { title: KITCHEN_STATUS_COLUMN_TITLES.PENDING, status: 'PENDING', orders: pendingOrders, headerClass: styles.headerPending },
    { title: KITCHEN_STATUS_COLUMN_TITLES.PREPARING, status: 'PREPARING', orders: preparingOrders, headerClass: styles.headerPreparing },
    { title: KITCHEN_STATUS_COLUMN_TITLES.READY, status: 'READY', orders: readyOrders, headerClass: styles.headerReady },
    { title: KITCHEN_STATUS_COLUMN_TITLES.SERVED, status: 'SERVED', orders: servedOrders, headerClass: styles.headerServed }
  ];

  const handleInitiateCloseDay = async () => {
    setIsClosingDay(true);
    setUnresolvedData(null);
    try {
      const res = await closeDay(false);
      if (!res.canClose) {
        setUnresolvedData(res);
      } else {
        setCloseSuccessToast(`Close Day Complete! ${res.clearedOrdersCount} orders cleared.`);
        setTimeout(() => setCloseSuccessToast(null), 5000);
      }
    } catch (err) {
      alert(`Close Day failed: ${err.message}`);
    } finally {
      setIsClosingDay(false);
    }
  };

  const handleConfirmForceCloseDay = async () => {
    setIsClosingDay(true);
    try {
      const res = await closeDay(true);
      setUnresolvedData(null);
      setCloseSuccessToast(`Close Day Completed! Cleared ${res.clearedOrdersCount} orders off board.`);
      setTimeout(() => setCloseSuccessToast(null), 5000);
    } catch (err) {
      alert(`Force Close Day failed: ${err.message}`);
    } finally {
      setIsClosingDay(false);
    }
  };

  const toggleExpandSecondary = (status) => {
    setExpandedSecondaryCols((prev) => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  return (
    <div className={styles.container}>
      {/* Toast Alert Banner */}
      {(toastMessage || closeSuccessToast) && (
        <div style={{
          backgroundColor: 'var(--color-brand)',
          color: '#ffffff',
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          fontWeight: 700,
          fontSize: 'var(--text-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: 'var(--shadow-card)',
          animation: 'slideDown 0.3s ease'
        }}>
          <Bell size={18} /> {closeSuccessToast || toastMessage}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ChefHat size={22} color="var(--color-brand)" /> Live Orders Tracker
          </h2>
          <p className={styles.subtitle}>Shared real-time order prep tracking across all café tables and stations ({role} view)</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* Admin Close Day Button */}
          {isAdmin && (
            <Button
              variant="danger"
              onClick={handleInitiateCloseDay}
              disabled={isClosingDay}
              style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
              title="End-of-day reset for live order board"
            >
              <Sunset size={16} /> {isClosingDay ? 'Closing...' : 'Close Day'}
            </Button>
          )}

          {/* Sound Mute/Unmute Toggle */}
          <button
            onClick={toggleSound}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
              color: isMuted ? 'var(--color-danger)' : 'var(--color-success)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title={isMuted ? 'Unmute Audio Chimes' : 'Mute Audio Chimes'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            {isMuted ? 'Sound Off' : 'Sound On'}
          </button>

          <button
            onClick={refreshOrders}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* 4-Column Kanban Grid */}
      {isLoading ? (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loading live orders...</p>
      ) : error ? (
        <p style={{ color: 'var(--color-danger)' }}>{error}</p>
      ) : (
        <div className={styles.kanbanGrid}>
          {columns.map((col) => {
            const isSecondary = roleConfig.secondary.includes(col.status);
            const isExpanded = expandedSecondaryCols[col.status];

            if (isSecondary && !isExpanded) {
              return (
                <div
                  key={col.status}
                  className={styles.column}
                  style={{ cursor: 'pointer', backgroundColor: 'var(--color-bg-secondary)', opacity: 0.85 }}
                  onClick={() => toggleExpandSecondary(col.status)}
                  title="Tap to expand finished column"
                >
                  <div className={`${styles.columnHeader} ${col.headerClass}`} style={{ borderBottom: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ChevronRight size={16} />
                      <span>{col.title}</span>
                    </div>
                    <span className={styles.badge}>{col.orders.length}</span>
                  </div>
                  <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--color-text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>
                    Tap to expand ({col.orders.length} completed)
                  </div>
                </div>
              );
            }

            return (
              <div key={col.status} className={styles.column}>
                <div
                  className={`${styles.columnHeader} ${col.headerClass}`}
                  onClick={isSecondary ? () => toggleExpandSecondary(col.status) : undefined}
                  style={{ cursor: isSecondary ? 'pointer' : 'default' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isSecondary && <ChevronDown size={16} />}
                    <span>{col.title}</span>
                  </div>
                  <span className={styles.badge}>{col.orders.length}</span>
                </div>

                <div className={styles.cardsList}>
                  {col.orders.length === 0 ? (
                    <div className={styles.emptyCol}>No active tickets in this column</div>
                  ) : (
                    col.orders.map((ord) => (
                      <OrderTicketCard
                        key={ord.id}
                        order={ord}
                        onAdvanceStatus={advanceKitchenStatus}
                        onCancelOrder={cancelOrder}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Close Day Safety Warning Modal */}
      {unresolvedData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            maxWidth: '480px',
            width: '90%',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ margin: 0, color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={22} /> Unresolved Orders Active ({unresolvedData.unresolvedOrdersCount})
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
              Close Day cannot proceed normally because the following orders are still in progress or unbilled.
            </p>

            {/* Unresolved Orders Breakdown */}
            <div style={{ margin: '12px 0', maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {unresolvedData.unresolvedOrders?.map((item) => (
                <div key={item.orderId} style={{ backgroundColor: 'var(--color-bg)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: 'var(--color-brand)' }}>{item.tableName}</strong> ({item.itemCount} items)
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      Placed {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ backgroundColor: 'rgba(196,57,43,0.15)', color: 'var(--color-danger)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '10px' }}>
                      {formatKitchenStatus(item.kitchenStatus)} ({item.status})
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setUnresolvedData(null)}>
                Handle Orders First
              </Button>
              <Button variant="danger" onClick={handleConfirmForceCloseDay} disabled={isClosingDay}>
                {isClosingDay ? 'Clearing...' : 'Close Day Anyway'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
