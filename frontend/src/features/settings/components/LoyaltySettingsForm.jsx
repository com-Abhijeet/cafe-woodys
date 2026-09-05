import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Award, Plus, Trash2, CheckCircle2, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import styles from './SettingsManager.module.css';

export function LoyaltySettingsForm() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [pointsEarnedPerUnit, setPointsEarnedPerUnit] = useState('1');
  const [spendUnitInRupees, setSpendUnitInRupees] = useState('10');
  const [maxRedemptionPercentOfBill, setMaxRedemptionPercentOfBill] = useState('');

  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // New Rule Form State
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRulePoints, setNewRulePoints] = useState('100');
  const [newRuleType, setNewRuleType] = useState('FLAT');
  const [newRuleValue, setNewRuleValue] = useState('50');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [settingsData, rulesData] = await Promise.all([
        apiClient('/loyalty-settings').catch(() => null),
        apiClient('/loyalty-redemption-rules').catch(() => []),
      ]);

      if (settingsData) {
        setIsEnabled(Boolean(settingsData.isEnabled));
        setPointsEarnedPerUnit(String(settingsData.pointsEarnedPerUnit ?? 1));
        setSpendUnitInRupees(String(settingsData.spendUnitInRupees ?? 10));
        setMaxRedemptionPercentOfBill(
          settingsData.maxRedemptionPercentOfBill !== null && settingsData.maxRedemptionPercentOfBill !== undefined
            ? String(settingsData.maxRedemptionPercentOfBill)
            : ''
        );
      }

      setRules(Array.isArray(rulesData) ? rulesData : []);
    } catch (err) {
      console.error('Failed to fetch loyalty settings:', err);
      setErrorMessage(err.message || 'Failed to load loyalty settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');

    try {
      const updated = await apiClient('/loyalty-settings', {
        method: 'PUT',
        body: {
          isEnabled,
          pointsEarnedPerUnit: Number(pointsEarnedPerUnit),
          spendUnitInRupees: Number(spendUnitInRupees),
          maxRedemptionPercentOfBill:
            maxRedemptionPercentOfBill.trim() === '' ? null : Number(maxRedemptionPercentOfBill),
        },
      });

      if (updated) {
        setIsEnabled(Boolean(updated.isEnabled));
        setPointsEarnedPerUnit(String(updated.pointsEarnedPerUnit));
        setSpendUnitInRupees(String(updated.spendUnitInRupees));
        setMaxRedemptionPercentOfBill(
          updated.maxRedemptionPercentOfBill !== null && updated.maxRedemptionPercentOfBill !== undefined
            ? String(updated.maxRedemptionPercentOfBill)
            : ''
        );
      }

      setToastMessage('Loyalty settings saved successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const val =
        newRuleType === 'FLAT'
          ? Math.round(Number(newRuleValue) * 100)
          : Number(newRuleValue);

      const created = await apiClient('/loyalty-redemption-rules', {
        method: 'POST',
        body: {
          pointsRequired: Number(newRulePoints),
          discountType: newRuleType,
          discountValue: val,
          isActive: true,
        },
      });

      setRules((prev) => [...prev, created].sort((a, b) => a.pointsRequired - b.pointsRequired));
      setShowAddRule(false);
      setNewRulePoints('100');
      setNewRuleType('FLAT');
      setNewRuleValue('50');
      setToastMessage('Redemption tier created!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to add tier');
    }
  };

  const handleToggleRule = async (rule) => {
    try {
      const updated = await apiClient(`/loyalty-redemption-rules/${rule.id}`, {
        method: 'PATCH',
        body: { isActive: !rule.isActive },
      });
      setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update tier');
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this redemption tier?')) return;
    try {
      await apiClient(`/loyalty-redemption-rules/${id}`, {
        method: 'DELETE',
      });
      setRules((prev) => prev.filter((r) => r.id !== id));
      setToastMessage('Redemption tier deleted');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete tier');
    }
  };

  if (isLoading) {
    return <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loading loyalty settings...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {toastMessage && (
        <div className={styles.successMessage}>
          <CheckCircle2 size={16} /> {toastMessage}
        </div>
      )}

      {errorMessage && (
        <div className={styles.errorMessage}>
          <AlertTriangle size={16} /> {errorMessage}
        </div>
      )}

      {/* Side-by-Side 2-Column Grid Container */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--space-4)', alignItems: 'start' }}>
        {/* Left Column: Program Settings Card */}
        <form onSubmit={handleSaveSettings} className={styles.formSection}>
          <h3
            style={{
              margin: 0,
              fontSize: 'var(--text-base)',
              color: 'var(--color-brand)',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Award size={18} /> Loyalty Program & Conversion Rules
          </h3>

          {/* Master Enable Toggle */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)' }}>
                Enable Loyalty Program
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                Earn points on paid bills & redeem discounts at checkout.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEnabled(!isEnabled)}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: isEnabled ? 'var(--color-success)' : 'var(--color-text-secondary)',
              }}
            >
              {isEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          {/* Point Earning Rate */}
          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}
          >
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)' }}>
              Point Conversion Rate
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Give</span>
              <Input
                type="number"
                min="1"
                value={pointsEarnedPerUnit}
                onChange={(e) => setPointsEarnedPerUnit(e.target.value)}
                style={{ width: '70px', textAlign: 'center' }}
                required
              />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>point(s) per ₹</span>
              <Input
                type="number"
                min="1"
                value={spendUnitInRupees}
                onChange={(e) => setSpendUnitInRupees(e.target.value)}
                style={{ width: '90px', textAlign: 'center' }}
                required
              />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>food & gaming spend</span>
            </div>
          </div>

          {/* Max Redemption Cap */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                marginBottom: '6px',
                color: 'var(--color-text-secondary)',
              }}
            >
              Max Redemption Cap (% of Bill Total)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={maxRedemptionPercentOfBill}
              onChange={(e) => setMaxRedemptionPercentOfBill(e.target.value)}
              placeholder="e.g. 50 (leave empty for no cap)"
            />
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Maximum percentage of a bill that points redemption can cover.
            </div>

            {maxRedemptionPercentOfBill.trim() === '' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(201, 139, 31, 0.1)',
                  color: 'var(--color-warning)',
                  border: '1px solid var(--color-warning)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '8px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>Warning: Without a redemption cap, points can reduce a bill down to ₹0.</span>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right', marginTop: 'var(--space-2)' }}>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Loyalty Settings'}
            </Button>
          </div>
        </form>

        {/* Right Column: Redemption Tiers Card */}
        <div className={styles.formSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-brand)', fontWeight: 800 }}>
                Redemption Tiers
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                Point discount choices available during checkout
              </div>
            </div>
            <Button variant="secondary" onClick={() => setShowAddRule(!showAddRule)} style={{ fontSize: 'var(--text-xs)', gap: '4px' }}>
              <Plus size={14} />
              {showAddRule ? 'Cancel' : 'Add Tier'}
            </Button>
          </div>

          {/* Add Tier Form */}
          {showAddRule && (
            <form
              onSubmit={handleAddRule}
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-brand)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)' }}>
                New Redemption Option
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Points Required
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={newRulePoints}
                    onChange={(e) => setNewRulePoints(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Discount Type
                  </label>
                  <select
                    value={newRuleType}
                    onChange={(e) => setNewRuleType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border)',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    <option value="FLAT">Flat Amount (₹)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    {newRuleType === 'FLAT' ? 'Discount Amount (₹)' : 'Discount (%)'}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={newRuleType === 'PERCENTAGE' ? '100' : undefined}
                    value={newRuleValue}
                    onChange={(e) => setNewRuleValue(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Button type="submit" variant="primary" style={{ fontSize: 'var(--text-xs)' }}>
                  Create Redemption Tier
                </Button>
              </div>
            </form>
          )}

          {/* Tiers List */}
          {rules.length === 0 ? (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: 0 }}>
              No redemption tiers configured yet. Tap "Add Tier" to create options (e.g. 100 pts → ₹50 off).
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {rules.map((rule) => {
                const discountText =
                  rule.discountType === 'FLAT'
                    ? `₹${(rule.discountValue / 100).toFixed(0)} Off`
                    : `${rule.discountValue}% Off`;

                return (
                  <div
                    key={rule.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      backgroundColor: 'var(--color-bg)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      opacity: rule.isActive ? 1 : 0.5,
                    }}
                  >
                    <div style={{ fontSize: 'var(--text-xs)' }}>
                      <strong style={{ color: 'var(--color-brand)' }}>{rule.pointsRequired} pts</strong>
                      <span style={{ margin: '0 8px', color: 'var(--color-text-secondary)' }}>→</span>
                      <strong style={{ color: 'var(--color-success)' }}>{discountText}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleRule(rule)}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          color: rule.isActive ? 'var(--color-success)' : 'var(--color-text-secondary)',
                        }}
                      >
                        {rule.isActive ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-danger)',
                          padding: '4px',
                        }}
                        title="Delete Tier"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
