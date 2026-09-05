import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Clock, CheckCircle2 } from 'lucide-react';

export function OrderSettingsForm() {
  const [orderCancellationWindowSeconds, setOrderCancellationWindowSeconds] = useState('300');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    apiClient('/order-settings')
      .then((data) => {
        if (data) {
          setOrderCancellationWindowSeconds(String(data.orderCancellationWindowSeconds ?? 300));
        }
      })
      .catch((err) => console.error('Failed to fetch order settings:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiClient('/order-settings', {
        method: 'PUT',
        body: {
          orderCancellationWindowSeconds: Number(orderCancellationWindowSeconds)
        }
      });
      setToastMessage('Order settings saved successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loading order settings...</p>;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: '640px' }}>
      {toastMessage && (
        <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-success)', color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={16} /> {toastMessage}
        </div>
      )}

      <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-brand)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={18} /> Order Workflow Rules & Undo Window
        </h3>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
            Waiter Order Cancellation Window (Seconds)
          </label>
          <Input
            type="number"
            min="10"
            max="3600"
            value={orderCancellationWindowSeconds}
            onChange={(e) => setOrderCancellationWindowSeconds(e.target.value)}
            placeholder="e.g. 300"
            required
          />
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Time limit (in seconds) after order submission during which waiters can self-cancel a just-placed order (default: 300s / 5 minutes). After expiry, cancellation requires Counter or Admin role.
          </div>
        </div>

        <div style={{ marginTop: '12px', textAlign: 'right' }}>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Order Rules'}
          </Button>
        </div>
      </div>
    </form>
  );
}
