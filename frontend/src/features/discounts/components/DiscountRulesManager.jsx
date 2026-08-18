import { useState } from 'react';
import { useDiscountRules } from '../hooks/useDiscountRules';
import { useZones } from '../../zones/hooks/useZones';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { Plus, Edit2, Trash2, Tag, Percent, Clock, AlertCircle } from 'lucide-react';
import styles from './DiscountRulesManager.module.css';

const DAYS_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DiscountRulesManager() {
  const { rules, isLoading, error, addRule, editRule, removeRule } = useDiscountRules();
  const { zones } = useZones();

  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('PERCENTAGE'); // 'PERCENTAGE' | 'FLAT'
  const [value, setValue] = useState('');
  const [scope, setScope] = useState('ALL'); // 'ALL' | 'CAFE_ONLY' | 'GAMING_ONLY' | 'ZONE'
  const [zoneId, setZoneId] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openAddModal = () => {
    setEditingRule(null);
    setName('');
    setType('PERCENTAGE');
    setValue('');
    setScope('ALL');
    setZoneId(zones[0]?.id || '');
    setDaysOfWeek([]);
    setStartTime('');
    setEndTime('');
    setIsActive(true);
    setActionError('');
    setShowModal(true);
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setName(rule.name);
    setType(rule.type);
    setValue(rule.type === 'FLAT' ? (rule.value / 100).toString() : rule.value.toString());
    setScope(rule.scope);
    setZoneId(rule.zoneId || zones[0]?.id || '');
    setDaysOfWeek(rule.daysOfWeek || []);
    setStartTime(rule.startTime || '');
    setEndTime(rule.endTime || '');
    setIsActive(rule.isActive);
    setActionError('');
    setShowModal(true);
  };

  const toggleDay = (dayIndex) => {
    setDaysOfWeek((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setIsSubmitting(true);

    const numericValue = type === 'FLAT' ? Math.round(parseFloat(value) * 100) : parseInt(value, 10);
    const payload = {
      name,
      type,
      value: numericValue,
      scope,
      zoneId: scope === 'ZONE' ? zoneId : null,
      daysOfWeek,
      startTime: startTime || null,
      endTime: endTime || null,
      isActive
    };

    try {
      if (editingRule) {
        await editRule(editingRule.id, payload);
      } else {
        await addRule(payload);
      }
      setShowModal(false);
    } catch (err) {
      setActionError(err.message || 'Failed to save discount rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      await editRule(rule.id, { isActive: !rule.isActive });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this discount rule?')) return;
    try {
      await removeRule(id);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Automatic Discount & Happy Hour Rules</h3>
          <p className={styles.subtitle}>Configure automatic recurring percentage or flat discounts for happy hours and zone promotions</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus size={16} /> Create Discount Rule
        </Button>
      </div>

      {isLoading ? (
        <p>Loading discount rules...</p>
      ) : error ? (
        <div className={styles.errorMessage}><AlertCircle size={16} /> {error}</div>
      ) : rules.length === 0 ? (
        <div style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
          No automatic discount rules defined yet. Click "Create Discount Rule" to set up happy hour promotions.
        </div>
      ) : (
        <div className={styles.grid}>
          {rules.map((rule) => {
            const formattedVal = rule.type === 'FLAT' ? `₹${(rule.value / 100).toFixed(0)} OFF` : `${rule.value}% OFF`;
            const daysText = rule.daysOfWeek?.length > 0 ? rule.daysOfWeek.map((d) => DAYS_MAP[d]).join(', ') : 'Everyday';
            const timeText = rule.startTime && rule.endTime ? `${rule.startTime} - ${rule.endTime}` : 'All Day';

            return (
              <div key={rule.id} className={`${styles.ruleCard} ${!rule.isActive ? styles.inactiveCard : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className={styles.ruleName}>{rule.name}</span>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-brand)', fontWeight: 700, marginTop: '2px' }}>
                      Scope: {rule.scope} {rule.zone ? `(${rule.zone.name})` : ''}
                    </div>
                  </div>
                  <span className={styles.ruleValBadge}>{formattedVal}</span>
                </div>

                <div className={styles.metaRow}>
                  <span><Clock size={13} style={{ display: 'inline', marginRight: '4px' }} /> {daysText} ({timeText})</span>
                </div>

                <div className={styles.actionsRow}>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(rule)}
                    className={`${styles.activeToggleBtn} ${rule.isActive ? styles.activeState : styles.inactiveState}`}
                  >
                    {rule.isActive ? 'Active Rule' : 'Inactive'}
                  </button>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <Button variant="secondary" onClick={() => openEditModal(rule)} style={{ padding: '4px 8px', minHeight: '34px' }}>
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(rule.id)} style={{ padding: '4px 8px', minHeight: '34px' }}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>{editingRule ? 'Edit Discount Rule' : 'Create Automatic Discount Rule'}</h3>
            {actionError && <div className={styles.errorMessage}><AlertCircle size={16} /> {actionError}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input label="Rule Name / Campaign Title" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Weekday Evening Happy Hour" />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label className={styles.label}>Discount Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className={styles.selectInput}>
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>

                <Input
                  label={type === 'PERCENTAGE' ? 'Discount Value (%)' : 'Discount Value (₹)'}
                  type="number"
                  step={type === 'PERCENTAGE' ? '1' : '0.5'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  placeholder={type === 'PERCENTAGE' ? 'e.g. 15' : 'e.g. 50'}
                />
              </div>

              <div>
                <label className={styles.label}>Applicable Scope</label>
                <select value={scope} onChange={(e) => setScope(e.target.value)} className={styles.selectInput}>
                  <option value="ALL">Entire Bill (Food + Gaming)</option>
                  <option value="CAFE_ONLY">Food & Drinks Only</option>
                  <option value="GAMING_ONLY">Gaming Charges Only</option>
                  <option value="ZONE">Specific Gaming Zone</option>
                </select>
              </div>

              {scope === 'ZONE' && (
                <div>
                  <label className={styles.label}>Select Zone</label>
                  <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className={styles.selectInput} required>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{z.name} ({z.type})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={styles.label}>Applicable Days of Week (Leave empty for Everyday)</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {DAYS_MAP.map((dayName, idx) => {
                    const isChecked = daysOfWeek.includes(idx);
                    return (
                      <button
                        key={dayName}
                        type="button"
                        className={`${styles.dayChip} ${isChecked ? styles.selectedDay : ''}`}
                        onClick={() => toggleDay(idx)}
                      >
                        {dayName}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <Input label="Start Time (HH:mm, optional)" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                <Input label="End Time (HH:mm, optional)" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="activeRule" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <label htmlFor="activeRule" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Enable & Activate Rule</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Discount Rule'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
