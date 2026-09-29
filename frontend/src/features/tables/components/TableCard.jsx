import { memo } from 'react';
import { Users, Gamepad2, ShoppingBag, AlertTriangle, Tag } from 'lucide-react';
import styles from './TableCard.module.css';

function TableCardComponent({ table, onStatusChange, onClick }) {
  const isGaming = table.zone?.type === 'GAMING';
  const accentClass = isGaming ? styles.gamingAccent : styles.cafeAccent;
  const badgeClass = isGaming ? styles.gamingBadge : styles.cafeBadge;

  const getStatusClass = (status) => {
    switch (status) {
      case 'OCCUPIED':
        return styles.statusOccupied;
      case 'RESERVED':
        return styles.statusReserved;
      case 'FREE':
      default:
        return styles.statusFree;
    }
  };

  const halfHourRs = table.effectiveHalfHourRate ? `₹${table.effectiveHalfHourRate / 100}/30m` : null;
  const hourlyRs = table.effectiveHourlyRate ? `₹${table.effectiveHourlyRate / 100}/hr` : null;

  // Check for Long-Running Gaming Session Flag (3+ hours active)
  const hasLongRunningSession = isGaming && (table.gamingSessions || []).some((s) => {
    if (!s.startTime) return false;
    const elapsedMins = (new Date() - new Date(s.startTime)) / (1000 * 60);
    return elapsedMins >= 180;
  });

  return (
    <div
      className={`${styles.card} ${accentClass}`}
      onClick={() => onClick && onClick(table)}
    >
      {/* 1. Card Header */}
      <div className={styles.header}>
        <div>
          <h3 className={styles.tableName}>{table.name}</h3>
          <div className={styles.statusDotRow}>
            <span className={`${styles.statusBadge} ${getStatusClass(table.status)}`}>
              <span className={styles.dot} />
              {table.status}
            </span>

            {table.hasOpenOrders && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--color-brand)', fontWeight: 600 }}>
                <ShoppingBag size={12} /> Open Order
              </span>
            )}

            {hasLongRunningSession && (
              <span style={{ backgroundColor: 'rgba(217, 119, 6, 0.15)', color: '#d97706', border: '1px solid #d97706', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '3px' }} title="Session active past 3 hours — check table">
                <AlertTriangle size={12} /> 3+ Hrs Active
              </span>
            )}
          </div>
        </div>

        <span className={`${styles.zoneBadge} ${badgeClass}`}>
          {isGaming ? 'Gaming' : 'Café'}
        </span>
      </div>

      {/* 2. Structured Details Area with reserved slots */}
      <div className={styles.details}>
        {/* Slot 1 & Slot 2: Capacity & Players */}
        <div className={styles.infoRow}>
          <span className={styles.infoItem}>
            <Users size={14} /> Capacity: <strong>{table.capacity} Seats</strong>
          </span>

          {isGaming ? (
            <span className={styles.infoItem} style={{ color: 'var(--color-gaming-zone)', fontWeight: 600 }}>
              <Gamepad2 size={14} /> {table.activePlayersCount || 0} / {table.effectiveMaxPlayers || table.capacity} Players
            </span>
          ) : (
            <span className={styles.infoItem} style={{ color: 'var(--color-text-secondary)' }}>
              —
            </span>
          )}
        </div>

        {/* Slot 3: Reserved Rates Line */}
        <div className={styles.infoRow} style={{ marginTop: '2px' }}>
          <span className={styles.ratePill} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Tag size={12} color="var(--color-brand)" /> Rates: {
              isGaming && (halfHourRs || hourlyRs)
                ? [halfHourRs, hourlyRs].filter(Boolean).join(' • ')
                : 'N/A (Food Only)'
            }
          </span>
        </div>

        {/* Slot 4: Pinned Status Dropdown */}
        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          <select
            value={table.status}
            onChange={(e) => onStatusChange && onStatusChange(table.id, e.target.value)}
            className={styles.statusSelect}
          >
            <option value="FREE">FREE</option>
            <option value="OCCUPIED">OCCUPIED</option>
            <option value="RESERVED">RESERVED</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export const TableCard = memo(TableCardComponent, (prev, next) => {
  return (
    prev.table.id === next.table.id &&
    prev.table.status === next.table.status &&
    prev.table.updatedAt === next.table.updatedAt &&
    prev.table.activePlayersCount === next.table.activePlayersCount &&
    prev.table.hasOpenOrders === next.table.hasOpenOrders
  );
});
