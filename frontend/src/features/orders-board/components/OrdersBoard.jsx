import { useOrdersBoard } from '../hooks/useOrdersBoard';
import { OrderTicketCard } from './OrderTicketCard';
import { ChefHat, RefreshCw, Volume2, VolumeX, Bell } from 'lucide-react';
import styles from './OrdersBoard.module.css';

export function OrdersBoard() {
  const {
    orders,
    isLoading,
    error,
    isMuted,
    toggleSound,
    toastMessage,
    refreshOrders,
    advanceKitchenStatus,
    cancelOrder
  } = useOrdersBoard();

  const pendingOrders = orders.filter((o) => (o.kitchenStatus || 'PENDING') === 'PENDING');
  const preparingOrders = orders.filter((o) => o.kitchenStatus === 'PREPARING');
  const readyOrders = orders.filter((o) => o.kitchenStatus === 'READY');
  const servedOrders = orders.filter((o) => o.kitchenStatus === 'SERVED');

  const columns = [
    { title: 'Pending Prep', status: 'PENDING', orders: pendingOrders, headerClass: styles.headerPending },
    { title: 'Currently Cooking', status: 'PREPARING', orders: preparingOrders, headerClass: styles.headerPreparing },
    { title: 'Ready for Service', status: 'READY', orders: readyOrders, headerClass: styles.headerReady },
    { title: 'Served to Table', status: 'SERVED', orders: servedOrders, headerClass: styles.headerServed }
  ];

  return (
    <div className={styles.container}>
      {/* Toast Alert Banner */}
      {toastMessage && (
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
          <Bell size={18} /> {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ChefHat size={22} color="var(--color-brand)" /> Kitchen & Live Orders Kanban Board
          </h2>
          <p className={styles.subtitle}>Shared real-time order prep tracking across all café tables and stations</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
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
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loading kitchen board...</p>
      ) : error ? (
        <p style={{ color: 'var(--color-danger)' }}>{error}</p>
      ) : (
        <div className={styles.kanbanGrid}>
          {columns.map((col) => (
            <div key={col.status} className={styles.column}>
              <div className={`${styles.columnHeader} ${col.headerClass}`}>
                <span>{col.title}</span>
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
          ))}
        </div>
      )}
    </div>
  );
}
