import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { CreditCard, ToggleLeft, ToggleRight, CheckCircle2, QrCode } from 'lucide-react';

export function PaymentSettingsForm() {
  const [upiId, setUpiId] = useState('');
  const [upiPayeeName, setUpiPayeeName] = useState('');
  const [autoMarkBillsPaidInFull, setAutoMarkBillsPaidInFull] = useState(false);
  const [alwaysSaveAndPrint, setAlwaysSaveAndPrint] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    apiClient('/payment-settings')
      .then((data) => {
        if (data) {
          setUpiId(data.upiId || '');
          setUpiPayeeName(data.upiPayeeName || '');
          setAutoMarkBillsPaidInFull(Boolean(data.autoMarkBillsPaidInFull));
          setAlwaysSaveAndPrint(Boolean(data.alwaysSaveAndPrint));
        }
      })
      .catch((err) => console.error('Failed to fetch payment settings:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiClient('/payment-settings', {
        method: 'PUT',
        body: {
          upiId: upiId.trim() || null,
          upiPayeeName: upiPayeeName.trim() || null,
          autoMarkBillsPaidInFull,
          alwaysSaveAndPrint
        }
      });
      setToastMessage('Payment settings saved successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loading payment settings...</p>;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: '640px' }}>
      {toastMessage && (
        <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-success)', color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={16} /> {toastMessage}
        </div>
      )}

      <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-brand)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CreditCard size={18} /> UPI Payment & Billing Checkout Automation
        </h3>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
            UPI VPA ID (for QR Generation)
          </label>
          <Input
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="e.g. cafewoodys@okicici"
          />
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Enables dynamic amount-embedded UPI QR codes on thermal printed bills and checkout modals.
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
            UPI Payee Name
          </label>
          <Input
            value={upiPayeeName}
            onChange={(e) => setUpiPayeeName(e.target.value)}
            placeholder="e.g. Cafe Woodys"
          />
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Merchant display name shown inside the customer's UPI app (Google Pay / PhonePe / Paytm / BHIM) during scan.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)' }}>
                Always Mark Bills as Paid in Full
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                Save Bill defaults to instant full payment settlement upon creation.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAutoMarkBillsPaidInFull(!autoMarkBillsPaidInFull)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: autoMarkBillsPaidInFull ? 'var(--color-success)' : 'var(--color-text-secondary)' }}
            >
              {autoMarkBillsPaidInFull ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)' }}>
                Always Save and Print Customer Receipt Together
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                Tapping Save Bill automatically triggers the thermal customer receipt print immediately after commit.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAlwaysSaveAndPrint(!alwaysSaveAndPrint)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: alwaysSaveAndPrint ? 'var(--color-success)' : 'var(--color-text-secondary)' }}
            >
              {alwaysSaveAndPrint ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>
        </div>

        <div style={{ marginTop: '12px', textAlign: 'right' }}>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Payment Settings'}
          </Button>
        </div>
      </div>
    </form>
  );
}
