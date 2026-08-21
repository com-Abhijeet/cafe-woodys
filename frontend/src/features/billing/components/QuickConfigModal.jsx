import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { Button } from '../../../components/ui/Button/Button';
import { X, Settings, Printer, CheckCircle, Zap } from 'lucide-react';

export function QuickConfigModal({
  isOpen,
  onClose,
  businessProfile,
  onProfileUpdated
}) {
  const [alwaysSaveAndPrint, setAlwaysSaveAndPrint] = useState(false);
  const [autoMarkBillsPaidInFull, setAutoMarkBillsPaidInFull] = useState(false);
  const [printWithParcelBill, setPrintWithParcelBill] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (businessProfile) {
      setAlwaysSaveAndPrint(Boolean(businessProfile.alwaysSaveAndPrint));
      setAutoMarkBillsPaidInFull(Boolean(businessProfile.autoMarkBillsPaidInFull));
    }
    // Fetch Kitchen Print Settings
    apiClient('/kitchen-print-settings')
      .then((res) => {
        if (res) setPrintWithParcelBill(Boolean(res.printWithParcelBill));
      })
      .catch(() => {});
  }, [businessProfile, isOpen]);

  if (!isOpen) return null;

  const handleToggleSaveAndPrint = async (val) => {
    setAlwaysSaveAndPrint(val);
    try {
      const res = await apiClient('/business-profile', {
        method: 'PATCH',
        body: { alwaysSaveAndPrint: val }
      });
      if (onProfileUpdated) onProfileUpdated(res);
      setMessage('Settings updated!');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAutoMarkPaid = async (val) => {
    setAutoMarkBillsPaidInFull(val);
    try {
      const res = await apiClient('/business-profile', {
        method: 'PATCH',
        body: { autoMarkBillsPaidInFull: val }
      });
      if (onProfileUpdated) onProfileUpdated(res);
      setMessage('Settings updated!');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleParcelSlip = async (val) => {
    setPrintWithParcelBill(val);
    try {
      await apiClient('/kitchen-print-settings', {
        method: 'PATCH',
        body: { printWithParcelBill: val }
      });
      setMessage('Settings updated!');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error(err);
    }
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
        maxWidth: '460px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--space-4)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} color="var(--color-brand)" />
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-brand)' }}>
              Quick Billing & Print Config
            </h3>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {message && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={14} /> {message}
            </div>
          )}

          {/* Toggle 1: Save & Print */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={14} /> Always save and print together
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Tapping Save Bill automatically prints the customer receipt immediately
              </div>
            </div>
            <input
              type="checkbox"
              checked={alwaysSaveAndPrint}
              onChange={(e) => handleToggleSaveAndPrint(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          {/* Toggle 2: Auto Mark Paid */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} /> Always mark bills as paid in full
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Save Bill defaults to instant full payment settlement
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoMarkBillsPaidInFull}
              onChange={(e) => handleToggleAutoMarkPaid(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          {/* Toggle 3: Parcel Slip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={14} /> Always print kitchen slip with parcel bill
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Print a KOT slip when takeaway/parcel bill is saved
              </div>
            </div>
            <input
              type="checkbox"
              checked={printWithParcelBill}
              onChange={(e) => handleToggleParcelSlip(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>
        </div>

        <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', textAlign: 'right' }}>
          <Button onClick={onClose} style={{ fontSize: 'var(--text-xs)' }}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
