import { useState, useEffect } from 'react';
import { useSettingsContext } from '../../../context/SettingsContext';
import { apiClient } from '../../../lib/apiClient';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Gamepad2, CheckCircle2 } from 'lucide-react';

export function GamingSettingsForm() {
  const { settings, isLoading, updateSettingModule } = useSettingsContext();
  const gamingData = settings?.gamingSettings;

  const [gamingGracePeriodMinutes, setGamingGracePeriodMinutes] = useState('5');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (gamingData) {
      setGamingGracePeriodMinutes(String(gamingData.gamingGracePeriodMinutes ?? 5));
    }
  }, [gamingData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await apiClient('/gaming-settings', {
        method: 'PUT',
        body: {
          gamingGracePeriodMinutes: Number(gamingGracePeriodMinutes)
        }
      });
      updateSettingModule('gamingSettings', updated || { gamingGracePeriodMinutes: Number(gamingGracePeriodMinutes) });
      setToastMessage('Gaming rules saved successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !gamingData) return <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loading gaming settings...</p>;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: '640px' }}>
      {toastMessage && (
        <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-success)', color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={16} /> {toastMessage}
        </div>
      )}

      <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-brand)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Gamepad2 size={18} /> Gaming Zone Grace Period Rules
        </h3>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
            Gaming Grace Period (Minutes)
          </label>
          <Input
            type="number"
            min="0"
            max="30"
            value={gamingGracePeriodMinutes}
            onChange={(e) => setGamingGracePeriodMinutes(e.target.value)}
            placeholder="e.g. 5"
            required
          />
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Forgiveness window (in minutes) applied at slab boundaries (30-min and 60-min boundaries) during gaming session checkout. For example, with a 5-minute grace period, a 33-minute session is charged at the 30-minute rate rather than jumping to the next hour.
          </div>
        </div>

        <div style={{ marginTop: '12px', textAlign: 'right' }}>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Gaming Rules'}
          </Button>
        </div>
      </div>
    </form>
  );
}
