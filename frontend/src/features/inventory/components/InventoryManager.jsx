import { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { ListRow } from '../../../components/ui/ListRow';
import { Plus, Edit2, AlertTriangle, CheckCircle, Sliders, History, Package, Trash2 } from 'lucide-react';
import styles from './InventoryManager.module.css';

export function InventoryManager() {
  const {
    items,
    isLoading,
    error,
    addInventoryItem,
    editInventoryItem,
    removeInventoryItem,
    adjustStock,
    getItemAuditHistory
  } = useInventory();

  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState(null);

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditItem, setAuditItem] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states (Item)
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('KG');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [reorderThreshold, setReorderThreshold] = useState('0');
  const [costPerUnitRs, setCostPerUnitRs] = useState('0');

  // Form states (Adjustment)
  const [adjDelta, setAdjDelta] = useState('');
  const [adjReason, setAdjReason] = useState('WASTAGE');
  const [adjNote, setAdjNote] = useState('');

  const filteredItems = selectedFilter === 'ALL'
    ? items
    : items.filter((i) => i.isLowStock);

  const lowStockCount = items.filter((i) => i.isLowStock).length;

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setUnit('KG');
    setStockQuantity('0');
    setReorderThreshold('0');
    setCostPerUnitRs('0');
    setActionError('');
    setShowItemModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setName(item.name);
    setUnit(item.unit);
    setStockQuantity(item.stockQuantity.toString());
    setReorderThreshold(item.reorderThreshold.toString());
    setCostPerUnitRs((item.costPerUnit / 100).toString());
    setActionError('');
    setShowItemModal(true);
  };

  const openAdjustModal = (item) => {
    setAdjustingItem(item);
    setAdjDelta('');
    setAdjReason('WASTAGE');
    setAdjNote('');
    setActionError('');
    setShowAdjustModal(true);
  };

  const openAuditModal = async (item) => {
    setAuditItem(item);
    setShowAuditModal(true);
    try {
      const logs = await getItemAuditHistory(item.id);
      setAuditLogs(logs);
    } catch (err) {
      alert(`Failed to load audit trail: ${err.message}`);
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setIsSubmitting(true);

    const costPaise = Math.round(parseFloat(costPerUnitRs) * 100);
    const payload = {
      name,
      unit,
      stockQuantity: parseFloat(stockQuantity),
      reorderThreshold: parseFloat(reorderThreshold),
      costPerUnit: costPaise
    };

    try {
      if (editingItem) {
        await editInventoryItem(editingItem.id, payload);
      } else {
        await addInventoryItem(payload);
      }
      setShowItemModal(false);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setActionError('');

    const deltaVal = parseFloat(adjDelta);
    if (!deltaVal || deltaVal === 0) {
      setActionError('Adjustment delta cannot be 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await adjustStock(adjustingItem.id, {
        delta: deltaVal,
        reason: adjReason,
        note: adjNote
      });
      setShowAdjustModal(false);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this raw material item?')) return;
    try {
      await removeInventoryItem(id);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Raw Material Inventory</h2>
          <p className={styles.subtitle}>Track raw ingredient stock, reorder thresholds, and manual wastage audit logs</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus size={16} /> Add Raw Material
        </Button>
      </div>

      {/* Summary Stats */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{items.length}</span>
          <span className={styles.statLabel}>Total Raw Materials</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: 'var(--color-success)' }}>
            {items.length - lowStockCount}
          </span>
          <span className={styles.statLabel}>Healthy Stock Items</span>
        </div>
        <div className={styles.statCard} style={{ borderColor: lowStockCount > 0 ? 'var(--color-danger)' : 'var(--color-border)' }}>
          <span className={styles.statValue} style={{ color: lowStockCount > 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
            {lowStockCount}
          </span>
          <span className={styles.statLabel}>Low Stock Alerts</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <button
          className={`${styles.filterBtn} ${selectedFilter === 'ALL' ? styles.activeFilter : ''}`}
          onClick={() => setSelectedFilter('ALL')}
        >
          All Items ({items.length})
        </button>
        <button
          className={`${styles.filterBtn} ${selectedFilter === 'LOW_STOCK' ? styles.activeFilter : ''}`}
          onClick={() => setSelectedFilter('LOW_STOCK')}
          style={{ color: selectedFilter === 'LOW_STOCK' ? '#fff' : 'var(--color-danger)' }}
        >
          Low Stock Alerts ({lowStockCount})
        </button>
      </div>

      {/* Item List Rows */}
      {isLoading ? (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loading inventory items...</p>
      ) : error ? (
        <p style={{ color: 'var(--color-danger)' }}>{error}</p>
      ) : filteredItems.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--color-bg)', borderRadius: '8px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          No inventory items match selected filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredItems.map((item) => (
            <ListRow
              key={item.id}
              title={item.name}
              subtitle={`Min Threshold: ${item.reorderThreshold} ${item.unit} • Unit Cost: ₹${(item.costPerUnit / 100).toFixed(2)}`}
              badgeText={item.isLowStock ? 'LOW STOCK' : 'HEALTHY'}
              badgeVariant={item.isLowStock ? 'danger' : 'success'}
              onClick={() => openAdjustModal(item)}
              fields={[
                { label: 'Current Stock', value: `${item.stockQuantity} ${item.unit}` },
                { label: 'Min Threshold', value: `${item.reorderThreshold} ${item.unit}` },
                { label: 'Unit Cost', value: `₹${(item.costPerUnit / 100).toFixed(2)}` }
              ]}
            />
          ))}
        </div>
      )}

      {/* Modal 1: Create / Edit Inventory Item */}
      {showItemModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3>{editingItem ? 'Edit Raw Material' : 'Add New Raw Material'}</h3>
            {actionError && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{actionError}</div>}
            <form onSubmit={handleItemSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input label="Item Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Whole Cream Milk, Espresso Beans" />
              
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Measurement Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginTop: '4px' }}
                >
                  <option value="KG">KG (Kilograms)</option>
                  <option value="G">G (Grams)</option>
                  <option value="L">L (Liters)</option>
                  <option value="ML">ML (Milliliters)</option>
                  <option value="PCS">PCS (Pieces / Units)</option>
                </select>
              </div>

              <Input label={`Current Stock (${unit})`} type="number" step="0.01" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} required />
              <Input label={`Reorder Min Threshold (${unit})`} type="number" step="0.01" value={reorderThreshold} onChange={(e) => setReorderThreshold(e.target.value)} required />
              <Input label={`Cost Per ${unit} (₹)`} type="number" step="0.5" value={costPerUnitRs} onChange={(e) => setCostPerUnitRs(e.target.value)} required placeholder="e.g. 65.00" />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="secondary" onClick={() => setShowItemModal(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Item'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Record Manual Stock Adjustment */}
      {showAdjustModal && adjustingItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3>Adjust Stock — {adjustingItem.name}</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Current Stock: <strong>{adjustingItem.stockQuantity} {adjustingItem.unit}</strong>
            </p>

            {actionError && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{actionError}</div>}

            <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input
                label={`Adjustment Delta (${adjustingItem.unit}) — Use negative for loss (-2.5) or positive for audit correction (+5.0)`}
                type="number"
                step="0.01"
                value={adjDelta}
                onChange={(e) => setAdjDelta(e.target.value)}
                required
                placeholder="-2.5 or +5.0"
              />

              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Adjustment Reason</label>
                <select
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginTop: '4px' }}
                >
                  <option value="WASTAGE">WASTAGE (Spillage / Expiry)</option>
                  <option value="DAMAGE">DAMAGE (Broken / Defective)</option>
                  <option value="CORRECTION">CORRECTION (Stocktake Audit)</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <Input label="Audit Note / Staff Remark (optional)" value={adjNote} onChange={(e) => setAdjNote(e.target.value)} placeholder="e.g. Spilled 2.5L during morning coffee prep" />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="secondary" onClick={() => setShowAdjustModal(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Recording...' : 'Submit Adjustment'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Audit Trail Log */}
      {showAuditModal && auditItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3>Audit Trail — {auditItem.name}</h3>

            {auditLogs.length === 0 ? (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>No manual adjustments recorded for this raw material.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {auditLogs.map((log) => {
                  const isNegative = Number(log.delta) < 0;
                  return (
                    <div key={log.id} style={{ backgroundColor: 'var(--color-bg)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                        <span style={{ color: isNegative ? 'var(--color-danger)' : 'var(--color-success)' }}>
                          {isNegative ? '' : '+'}{log.delta} {auditItem.unit} ({log.reason})
                        </span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        By Staff: <strong>{log.staff?.username}</strong> {log.note ? `• ${log.note}` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={() => setShowAuditModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
