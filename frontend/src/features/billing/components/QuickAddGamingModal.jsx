import React, { useState } from 'react';
import { Gamepad2, Users, Coins, X, AlertCircle, Plus, Minus } from 'lucide-react';
import styles from './QuickAddGamingModal.module.css';
import DurationSelector from '../../../components/ui/DurationSelector';
import { apiClient } from '../../../lib/apiClient';

export default function QuickAddGamingModal({ isOpen, onClose, table, onSuccess }) {
  const [playerCount, setPlayerCount] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [flatOverrideRs, setFlatOverrideRs] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !table) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const count = parseInt(playerCount, 10);
    if (isNaN(count) || count < 1) {
      setError('Player count must be at least 1');
      return;
    }

    const duration = parseInt(durationMinutes, 10);
    if (isNaN(duration) || duration < 1) {
      setError('Duration must be greater than 0');
      return;
    }

    let flatAmountOverride = null;
    if (flatOverrideRs && flatOverrideRs.trim() !== '') {
      const parsedFlat = parseFloat(flatOverrideRs);
      if (isNaN(parsedFlat) || parsedFlat <= 0) {
        setError('Flat amount override must be a positive number');
        return;
      }
      flatAmountOverride = Math.round(parsedFlat * 100);
    }

    try {
      setLoading(true);
      await apiClient(`/tables/${table.id}/gaming-sessions/quick-add`, {
        method: 'POST',
        body: {
          playerCount: count,
          durationMinutes: duration,
          flatAmountOverride
        }
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add quick gaming charge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.iconBadge}>
              <Gamepad2 size={20} color="var(--color-gaming-zone)" />
            </div>
            <div>
              <h3>Quick Add Gaming Charge</h3>
              <span className={styles.tableBadge}>{table.name}</span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorAlert}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label className={styles.labelWithIcon}>
              <Users size={14} color="var(--color-gaming-zone)" /> Number of Players
            </label>
            <div className={styles.counterRow}>
              <button
                type="button"
                className={styles.counterBtn}
                onClick={() => setPlayerCount((c) => Math.max(1, c - 1))}
                title="Decrease players"
              >
                <Minus size={16} />
              </button>
              <span className={styles.counterVal}>{playerCount}</span>
              <button
                type="button"
                className={styles.counterBtn}
                onClick={() => setPlayerCount((c) => c + 1)}
                title="Increase players"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <DurationSelector
            value={durationMinutes}
            onChange={(m) => setDurationMinutes(m)}
          />

          <div className={styles.fieldGroup}>
            <label className={styles.labelWithIcon}>
              <Coins size={14} color="var(--color-gaming-zone)" /> Flat Charge Override (₹) <span className={styles.optional}>(Optional)</span>
            </label>
            <div className={styles.currencyInputWrapper}>
              <span className={styles.currencyPrefix}>₹</span>
              <input
                type="number"
                step="0.01"
                placeholder="Leave empty to use zone slab rates"
                value={flatOverrideRs}
                onChange={(e) => setFlatOverrideRs(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Adding...' : 'Add Gaming Charge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
