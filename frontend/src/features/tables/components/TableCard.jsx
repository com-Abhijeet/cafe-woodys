import { Users, Gamepad2, ShoppingBag } from 'lucide-react';
import styles from './TableCard.module.css';

export function TableCard({ table, onStatusChange, onClick }) {
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

  return (
    <div
      className={`${styles.card} ${accentClass}`}
      onClick={() => onClick && onClick(table)}
    >
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
          </div>
        </div>
        <span className={`${styles.zoneBadge} ${badgeClass}`}>
          {isGaming ? 'Gaming' : 'Café'}
        </span>
      </div>

      <div className={styles.details}>
        <div className={styles.infoRow}>
          <span className={styles.infoItem}>
            <Users size={14} /> Capacity: <strong>{table.capacity} Seats</strong>
          </span>

          {isGaming && table.effectiveMaxPlayers && (
            <span className={styles.infoItem} style={{ color: 'var(--color-gaming-zone)', fontWeight: 600 }}>
              <Gamepad2 size={14} /> {table.activePlayersCount} / {table.effectiveMaxPlayers} Players
            </span>
          )}
        </div>

        {isGaming && (halfHourRs || hourlyRs) && (
          <div className={styles.infoRow} style={{ marginTop: '2px' }}>
            <span className={styles.ratePill}>
              Rates: {[halfHourRs, hourlyRs].filter(Boolean).join(' • ')}
            </span>
          </div>
        )}

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
