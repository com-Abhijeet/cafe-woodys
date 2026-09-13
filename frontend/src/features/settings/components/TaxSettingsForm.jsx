import { useState, useEffect } from 'react';
import { useSettingsContext } from '../../../context/SettingsContext';
import { apiClient } from '../../../lib/apiClient';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Percent, ToggleLeft, ToggleRight, CheckCircle2 } from 'lucide-react';

export function TaxSettingsForm() {
  const { settings, isLoading, updateSettingModule } = useSettingsContext();
  const taxData = settings?.taxSettings;

  const [defaultGstPercent, setDefaultGstPercent] = useState('5');
  const [pricesIncludeTax, setPricesIncludeTax] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (taxData) {
      setDefaultGstPercent(String(taxData.defaultGstPercent ?? 5));
      setPricesIncludeTax(Boolean(taxData.pricesIncludeTax));
    }
  }, [taxData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await apiClient('/tax-settings', {
        method: 'PUT',
        body: {
          defaultGstPercent: Number(defaultGstPercent),
          pricesIncludeTax
        }
      });
      updateSettingModule('taxSettings', updated || { defaultGstPercent: Number(defaultGstPercent), pricesIncludeTax });
      setToastMessage('Tax settings saved successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !taxData) return <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loading tax settings...</p>;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: '640px' }}>
      {toastMessage && (
        <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-success)', color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={16} /> {toastMessage}
        </div>
      )}

      <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-brand)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Percent size={18} /> Default Tax & Pricing Calculation Mode
        </h3>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
            Default Fallback GST Rate (%)
          </label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={defaultGstPercent}
            onChange={(e) => setDefaultGstPercent(e.target.value)}
            placeholder="e.g. 5"
            required
          />
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Fallback GST rate applied only when a Menu Item or Gaming Zone does not specify its own custom tax rate.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginTop: '6px' }}>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)' }}>
              Menu Prices Include GST (Tax-Inclusive Pricing)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              If enabled, GST is extracted from within menu prices rather than added on top during checkout.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPricesIncludeTax(!pricesIncludeTax)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: pricesIncludeTax ? 'var(--color-success)' : 'var(--color-text-secondary)' }}
          >
            {pricesIncludeTax ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
          </button>
        </div>

        <div style={{ marginTop: '12px', textAlign: 'right' }}>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Tax Settings'}
          </Button>
        </div>
      </div>
    </form>
  );
}
