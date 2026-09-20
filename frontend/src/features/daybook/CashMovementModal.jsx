import React, { useState } from 'react';
import { Wallet, ArrowDownRight, ArrowUpRight, X, AlertCircle } from 'lucide-react';
import styles from './CashMovementModal.module.css';

export default function CashMovementModal({ isOpen, onClose, onSubmit }) {
  const [type, setType] = useState('CASH_IN');
  const [amountRs, setAmountRs] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const val = parseFloat(amountRs);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid amount greater than ₹0');
      return;
    }
    if (!reason.trim()) {
      setError('Reason is required for all cash movements');
      return;
    }

    try {
      setLoading(true);
      const amountPaise = Math.round(val * 100);
      await onSubmit({ type, amount: amountPaise, reason: reason.trim() });
      setAmountRs('');
      setReason('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record cash movement');
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
              <Wallet size={20} color="var(--color-brand)" />
            </div>
            <h3>Record Cash Movement</h3>
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

          <div className={styles.typeSelector}>
            <button
              type="button"
              className={`${styles.typeBtn} ${styles.inBtn} ${type === 'CASH_IN' ? styles.activeIn : ''}`}
              onClick={() => setType('CASH_IN')}
            >
              <ArrowDownRight size={16} /> + Cash In (Receipt / Float)
            </button>
            <button
              type="button"
              className={`${styles.typeBtn} ${styles.outBtn} ${type === 'CASH_OUT' ? styles.activeOut : ''}`}
              onClick={() => setType('CASH_OUT')}
            >
              <ArrowUpRight size={16} /> - Cash Out (Expense / Draw)
            </button>
          </div>

          <div className={styles.fieldGroup}>
            <label>Amount (₹)</label>
            <div className={styles.currencyInputWrapper}>
              <span className={styles.currencyPrefix}>₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 500.00"
                value={amountRs}
                onChange={(e) => setAmountRs(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label>Reason / Explanation</label>
            <textarea
              rows="3"
              placeholder="e.g. Owner float top-up, Petty cash tea/snacks, Supplier payment"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Saving...' : 'Record Cash Movement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
