import { useState } from 'react';
import { useZones } from '../hooks/useZones';
import { useTables } from '../../tables/hooks/useTables';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import styles from './ZoneTableManager.module.css';

export function ZoneTableManager() {
  const { zones, addZone, editZone, removeZone, refreshZones } = useZones();
  const { tables, addTable, editTable, removeTable, refreshTables } = useTables();

  const [activeModal, setActiveModal] = useState(null); // 'ADD_ZONE' | 'EDIT_ZONE' | 'ADD_TABLE' | 'EDIT_TABLE'
  const [selectedItem, setSelectedItem] = useState(null);
  const [errorAlert, setErrorAlert] = useState('');

  // Zone form
  const [zoneName, setZoneName] = useState('');
  const [zoneType, setZoneType] = useState('CAFE');
  const [defaultHalfHourRs, setDefaultHalfHourRs] = useState('');
  const [defaultHourlyRs, setDefaultHourlyRs] = useState('');
  const [defaultMaxPlayers, setDefaultMaxPlayers] = useState('');
  const [zoneGstPercent, setZoneGstPercent] = useState('');

  // Table form
  const [tableName, setTableName] = useState('');
  const [tableZoneId, setTableZoneId] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [halfHourRs, setHalfHourRs] = useState('');
  const [hourlyRs, setHourlyRs] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');

  const openAddZone = () => {
    setZoneName('');
    setZoneType('CAFE');
    setDefaultHalfHourRs('');
    setDefaultHourlyRs('');
    setDefaultMaxPlayers('');
    setZoneGstPercent('');
    setActiveModal('ADD_ZONE');
  };

  const openEditZone = (zone) => {
    setSelectedItem(zone);
    setZoneName(zone.name);
    setZoneType(zone.type);
    setDefaultHalfHourRs(zone.defaultHalfHourRate ? zone.defaultHalfHourRate / 100 : '');
    setDefaultHourlyRs(zone.defaultHourlyRate ? zone.defaultHourlyRate / 100 : '');
    setDefaultMaxPlayers(zone.defaultMaxPlayers || '');
    setZoneGstPercent(zone.gstPercent != null ? zone.gstPercent.toString() : '');
    setActiveModal('EDIT_ZONE');
  };

  const handleSaveZone = async (e) => {
    e.preventDefault();
    setErrorAlert('');
    const payload = {
      name: zoneName,
      type: zoneType,
      defaultHalfHourRate: defaultHalfHourRs ? Math.round(parseFloat(defaultHalfHourRs) * 100) : null,
      defaultHourlyRate: defaultHourlyRs ? Math.round(parseFloat(defaultHourlyRs) * 100) : null,
      defaultMaxPlayers: defaultMaxPlayers ? parseInt(defaultMaxPlayers) : null,
      gstPercent: zoneGstPercent !== '' ? parseFloat(zoneGstPercent) : null
    };

    try {
      if (activeModal === 'ADD_ZONE') {
        await addZone(payload);
      } else {
        await editZone(selectedItem.id, payload);
      }
      await refreshTables();
      setActiveModal(null);
    } catch (err) {
      setErrorAlert(err.message);
    }
  };

  const handleDeleteZone = async (id) => {
    if (!confirm('Are you sure you want to delete this zone?')) return;
    try {
      await removeZone(id);
    } catch (err) {
      alert(err.message);
    }
  };

  const openAddTable = () => {
    setTableName('');
    setTableZoneId(zones[0]?.id || '');
    setCapacity('4');
    setHalfHourRs('');
    setHourlyRs('');
    setMaxPlayers('');
    setActiveModal('ADD_TABLE');
  };

  const openEditTable = (table) => {
    setSelectedItem(table);
    setTableName(table.name);
    setTableZoneId(table.zoneId);
    setCapacity(String(table.capacity));
    setHalfHourRs(table.halfHourRate ? table.halfHourRate / 100 : '');
    setHourlyRs(table.hourlyRate ? table.hourlyRate / 100 : '');
    setMaxPlayers(table.maxPlayers ? String(table.maxPlayers) : '');
    setActiveModal('EDIT_TABLE');
  };

  const handleSaveTable = async (e) => {
    e.preventDefault();
    setErrorAlert('');
    const payload = {
      zoneId: tableZoneId,
      name: tableName,
      capacity: parseInt(capacity),
      halfHourRate: halfHourRs ? Math.round(parseFloat(halfHourRs) * 100) : null,
      hourlyRate: hourlyRs ? Math.round(parseFloat(hourlyRs) * 100) : null,
      maxPlayers: maxPlayers ? parseInt(maxPlayers) : null
    };

    try {
      if (activeModal === 'ADD_TABLE') {
        await addTable(payload);
      } else {
        await editTable(selectedItem.id, payload);
      }
      await refreshZones();
      setActiveModal(null);
    } catch (err) {
      setErrorAlert(err.message);
    }
  };

  const handleDeleteTable = async (id) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    try {
      await removeTable(id);
    } catch (err) {
      alert(err.message);
    }
  };

  const selectedZoneObject = zones.find((z) => z.id === tableZoneId);

  return (
    <div className={styles.container}>
      {/* 1. Zone Management */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Floor Zones</h2>
            <p className={styles.sectionSubtitle}>Define pricing tiers, custom GST rates & zone categories</p>
          </div>
          <Button onClick={openAddZone}>
            <Plus size={16} /> Add Zone
          </Button>
        </div>

        <div className={styles.gridList}>
          {zones.map((zone) => (
            <div key={zone.id} className={styles.itemCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={styles.itemTitle}>{zone.name}</span>
                <span className={`${styles.zoneBadge} ${zone.type === 'GAMING' ? styles.gamingBadge : styles.cafeBadge}`}>
                  {zone.type}
                </span>
              </div>
              <div className={styles.itemMeta}>
                Tables: <strong>{zone.tables?.length || 0}</strong> • GST: <strong>{zone.gstPercent != null ? `${zone.gstPercent}%` : 'Default Fallback'}</strong>
              </div>
              {zone.type === 'GAMING' && (
                <div className={styles.itemMeta}>
                  Default Rates: ₹{zone.defaultHalfHourRate ? zone.defaultHalfHourRate / 100 : 0}/30m • ₹{zone.defaultHourlyRate ? zone.defaultHourlyRate / 100 : 0}/hr
                </div>
              )}
              <div className={styles.itemActions}>
                <Button variant="secondary" onClick={() => openEditZone(zone)}>
                  <Edit2 size={14} /> Edit
                </Button>
                <Button variant="danger" onClick={() => handleDeleteZone(zone.id)}>
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Table Management */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Physical Floor Tables</h2>
            <p className={styles.sectionSubtitle}>Manage seating capacity and per-table overrides</p>
          </div>
          <Button onClick={openAddTable} disabled={zones.length === 0}>
            <Plus size={16} /> Add Table
          </Button>
        </div>

        <div className={styles.gridList}>
          {tables.map((table) => (
            <div key={table.id} className={styles.itemCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={styles.itemTitle}>{table.name}</span>
                <span className={styles.itemMeta}>Zone: {table.zone?.name}</span>
              </div>
              <div className={styles.itemMeta}>
                Capacity: <strong>{table.capacity} Seats</strong>
              </div>
              {table.zone?.type === 'GAMING' && (
                <div className={styles.itemMeta}>
                  Effective Rate: ₹{(table.effectiveHalfHourRate || 0) / 100}/30m • ₹{(table.effectiveHourlyRate || 0) / 100}/hr
                  {table.hourlyRate && <span style={{ color: 'var(--color-brand)', fontWeight: 700 }}> (Custom Override)</span>}
                </div>
              )}
              <div className={styles.itemActions}>
                <Button variant="secondary" onClick={() => openEditTable(table)}>
                  <Edit2 size={14} /> Edit
                </Button>
                <Button variant="danger" onClick={() => handleDeleteTable(table.id)}>
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Zone */}
      {(activeModal === 'ADD_ZONE' || activeModal === 'EDIT_ZONE') && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>{activeModal === 'ADD_ZONE' ? 'Add New Floor Zone' : 'Edit Zone'}</h3>
            {errorAlert && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{errorAlert}</div>}
            <form onSubmit={handleSaveZone} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input label="Zone Name" value={zoneName} onChange={(e) => setZoneName(e.target.value)} required placeholder="e.g. Lounge Area" />

              <div className={styles.formGroup}>
                <label className={styles.label}>Zone Type</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input type="radio" value="CAFE" checked={zoneType === 'CAFE'} onChange={() => setZoneType('CAFE')} /> Café (Food Only)
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" value="GAMING" checked={zoneType === 'GAMING'} onChange={() => setZoneType('GAMING')} /> Gaming (Hourly Rate + Food)
                  </label>
                </div>
              </div>

              <Input label="Zone GST Rate % (optional — leave empty for default fallback)" type="number" step="0.5" value={zoneGstPercent} onChange={(e) => setZoneGstPercent(e.target.value)} placeholder="e.g. 18 for Gaming zone" />

              {zoneType === 'GAMING' && (
                <>
                  <Input label="Default 30-Min Rate (₹ per player)" type="number" value={defaultHalfHourRs} onChange={(e) => setDefaultHalfHourRs(e.target.value)} placeholder="e.g. 50" required />
                  <Input label="Default 60-Min Rate (₹ per player)" type="number" value={defaultHourlyRs} onChange={(e) => setDefaultHourlyRs(e.target.value)} placeholder="e.g. 90" required />
                  <Input label="Default Seat Capacity per Table" type="number" value={defaultMaxPlayers} onChange={(e) => setDefaultMaxPlayers(e.target.value)} placeholder="e.g. 4" />
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="secondary" onClick={() => setActiveModal(null)}>Cancel</Button>
                <Button type="submit">Save Zone</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Table */}
      {(activeModal === 'ADD_TABLE' || activeModal === 'EDIT_TABLE') && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>{activeModal === 'ADD_TABLE' ? 'Add New Floor Table' : 'Edit Table'}</h3>
            {errorAlert && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{errorAlert}</div>}
            <form onSubmit={handleSaveTable} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Zone</label>
                <select value={tableZoneId} onChange={(e) => setTableZoneId(e.target.value)} className={styles.selectInput} required>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name} ({z.type})</option>
                  ))}
                </select>
              </div>

              <Input label="Table Name" value={tableName} onChange={(e) => setTableName(e.target.value)} required placeholder="e.g. Table T6 or Console G5" />
              <Input label="Seating Capacity" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} required />

              {selectedZoneObject?.type === 'GAMING' && (
                <>
                  <Input
                    label="Custom 30-Min Rate Override (₹, optional)"
                    type="number"
                    value={halfHourRs}
                    onChange={(e) => setHalfHourRs(e.target.value)}
                    placeholder={`Zone Default: ₹${selectedZoneObject.defaultHalfHourRate ? selectedZoneObject.defaultHalfHourRate / 100 : 0}`}
                  />
                  <Input
                    label="Custom 60-Min Rate Override (₹, optional)"
                    type="number"
                    value={hourlyRs}
                    onChange={(e) => setHourlyRs(e.target.value)}
                    placeholder={`Zone Default: ₹${selectedZoneObject.defaultHourlyRate ? selectedZoneObject.defaultHourlyRate / 100 : 0}`}
                  />
                  <Input
                    label="Custom Max Players Override (optional)"
                    type="number"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(e.target.value)}
                    placeholder={`Zone Default: ${selectedZoneObject.defaultMaxPlayers || 'None'}`}
                  />
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="secondary" onClick={() => setActiveModal(null)}>Cancel</Button>
                <Button type="submit">Save Table</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
