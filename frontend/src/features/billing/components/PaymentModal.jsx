import { useState } from 'react';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { X, DollarSign, QrCode, CreditCard, Receipt } from 'lucide-react';

export function PaymentModal({
  isOpen,
  onClose,
  remainingRs,
  defaultMethod = 'CASH',
  onSubmitPayment,
  isSubmitting = false
}) {
  const [method, setMethod] = useState(defaultMethod);
  const [amountRs, setAmountRs] = useState(remainingRs || '0.00');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const paise = Math.round(parseFloat(amountRs) * 100);
    if (!paise || paise <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    onSubmitPayment({
      amount: paise,
      method,
      reference: reference.trim() || null
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1200,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)'
    }}>
      <div style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-modal)',
        width: '100%',
        maxWidth: '480px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: 'var(--space-4)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--color-surface)'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-brand)' }}>
              Record Payment Details
            </h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Custom amount, split tender, or payment reference
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {error && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', backgroundColor: 'rgba(196,57,43,0.1)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-primary)' }}>
              Select Payment Method
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { key: 'CASH', label: 'Cash', icon: DollarSign },
                { key: 'UPI', label: 'UPI / QR', icon: QrCode },
                { key: 'CARD', label: 'Card', icon: CreditCard },
                { key: 'OTHER', label: 'Other', icon: Receipt }
              ].map((m) => {
                const Icon = m.icon;
                const isSel = method === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMethod(m.key)}
                    style={{
                      padding: '10px 4px',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${isSel ? 'var(--color-brand)' : 'var(--color-border)'}`,
                      backgroundColor: isSel ? 'rgba(44,62,80,0.1)' : 'var(--color-bg)',
                      color: isSel ? 'var(--color-brand)' : 'var(--color-text-primary)',
                      fontWeight: isSel ? 800 : 600,
                      fontSize: 'var(--text-xs)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Icon size={16} /> {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Input
            label="Amount to Record (₹)"
            type="number"
            step="0.01"
            value={amountRs}
            onChange={(e) => setAmountRs(e.target.value)}
            required
          />

          <Input
            label="Txn Reference / Note (Optional)"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. UTR / Auth Code / Note"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : `Record ₹${amountRs || '0.00'}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
