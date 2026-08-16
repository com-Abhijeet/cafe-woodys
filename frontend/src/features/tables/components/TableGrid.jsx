import { useState } from 'react';
import { useTables } from '../hooks/useTables';
import { useZones } from '../../zones/hooks/useZones';
import { TableCard } from './TableCard';
import { TableWorkspaceModal } from './TableWorkspaceModal';
import { RefreshCw } from 'lucide-react';
import styles from './TableGrid.module.css';

export function TableGrid({ onSelectTable }) {
  const { zones } = useZones();
  const { tables, isLoading, error, refreshTables, editTable } = useTables();

  const [selectedZoneFilter, setSelectedZoneFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [activeModalTable, setActiveModalTable] = useState(null);

  const filteredTables = tables.filter((table) => {
    if (selectedZoneFilter !== 'ALL' && table.zoneId !== selectedZoneFilter) {
      return false;
    }
    if (selectedStatusFilter !== 'ALL' && table.status !== selectedStatusFilter) {
      return false;
    }
    return true;
  });

  const totalTables = tables.length;
  const freeTables = tables.filter((t) => t.status === 'FREE').length;
  const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED').length;
  const totalActivePlayers = tables.reduce((sum, t) => sum + (t.activePlayersCount || 0), 0);

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      await editTable(tableId, { status: newStatus });
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleCardClick = (table) => {
    setActiveModalTable(table);
    if (onSelectTable) onSelectTable(table);
  };

  return (
    <div className={styles.container}>
      {/* Quick Summary Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalTables}</span>
          <span className={styles.statLabel}>Total Floor Tables</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: 'var(--color-success)' }}>
            {freeTables}
          </span>
          <span className={styles.statLabel}>Free Tables</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: 'var(--color-warning)' }}>
            {occupiedTables}
          </span>
          <span className={styles.statLabel}>Occupied Tables</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: 'var(--color-gaming-zone)' }}>
            {totalActivePlayers}
          </span>
          <span className={styles.statLabel}>Active Gaming Players</span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className={styles.filterHeader}>
        <div className={styles.filterGroup}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
            ZONE:
          </span>
          <button
            className={`${styles.pillButton} ${selectedZoneFilter === 'ALL' ? styles.activePill : ''}`}
            onClick={() => setSelectedZoneFilter('ALL')}
          >
            All Zones
          </button>
          {zones.map((zone) => (
            <button
              key={zone.id}
              className={`${styles.pillButton} ${selectedZoneFilter === zone.id ? styles.activePill : ''}`}
              onClick={() => setSelectedZoneFilter(zone.id)}
            >
              {zone.name}
            </button>
          ))}
        </div>

        <div className={styles.filterGroup}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
            STATUS:
          </span>
          {['ALL', 'FREE', 'OCCUPIED', 'RESERVED'].map((status) => (
            <button
              key={status}
              className={`${styles.pillButton} ${selectedStatusFilter === status ? styles.activePill : ''}`}
              onClick={() => setSelectedStatusFilter(status)}
            >
              {status}
            </button>
          ))}
          <button
            onClick={refreshTables}
            className={styles.pillButton}
            title="Refresh floor state"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <RefreshCw size={14} /> Sync
          </button>
        </div>
      </div>

      {/* Grid of Tables */}
      {isLoading ? (
        <div className={styles.emptyState}>Loading floor tables...</div>
      ) : error ? (
        <div className={styles.emptyState} style={{ color: 'var(--color-danger)' }}>
          {error}
        </div>
      ) : filteredTables.length === 0 ? (
        <div className={styles.emptyState}>
          No tables match the selected filters.
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onStatusChange={handleStatusChange}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}

      {/* Full-Screen Workspace Modal */}
      {activeModalTable && (
        <TableWorkspaceModal
          table={activeModalTable}
          onClose={() => setActiveModalTable(null)}
          onRefreshTable={refreshTables}
        />
      )}
    </div>
  );
}
