import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Award, PlusCircle, RefreshCw, AlertCircle } from 'lucide-react';
import styles from './CustomerCRMManager.module.css';

export function CustomerLoyaltyTab({ customerId }) {
  const [loyaltyData, setLoyaltyData] = useState({ balance: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Manual Adjust Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustPointsDelta, setAdjustPointsDelta] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState(null);

  const fetchLoyalty = async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient(`/customers/${customerId}/loyalty`);
      setLoyaltyData(data || { balance: 0, transactions: [] });
    } catch (err) {
      setError(err.message || 'Failed to fetch customer loyalty');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoyalty();
  }, [customerId]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setAdjusting(true);
    setAdjustError(null);

    try {
      await apiClient(`/customers/${customerId}/loyalty/adjust`, {
        method: 'POST',
        body: {
          pointsDelta: Number(adjustPointsDelta),
          note: adjustNote,
        },
      });

      setShowAdjustModal(false);
      setAdjustPointsDelta('');
      setAdjustNote('');
      fetchLoyalty();
    } catch (err) {
      setAdjustError(err.message || 'Failed to adjust points');
    } finally {
      setAdjusting(false);
    }
  };

  if (loading) {
    return <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', padding: '16px 0' }}>Loading loyalty balance and history...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {/* Header Balance Card */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'rgba(230, 126, 34, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-brand)',
            }}
          >
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Current Loyalty Balance</div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-brand)' }}>
              {loyaltyData.balance} <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Points</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" onClick={() => fetchLoyalty()} style={{ fontSize: 'var(--text-xs)', gap: '4px' }}>
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button onClick={() => setShowAdjustModal(true)} style={{ fontSize: 'var(--text-xs)', gap: '4px' }}>
            <PlusCircle size={14} /> Adjust Points
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', backgroundColor: 'rgba(231, 76, 60, 0.15)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
          {error}
        </div>
      )}

      {/* Transactions History Ledger */}
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)' }}>
          Points Ledger & History ({loyaltyData.transactions?.length || 0} Transactions)
        </h4>

        {loyaltyData.transactions.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)', fontStyle: 'italic', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)' }}>
            No loyalty transactions recorded for this customer yet.
          </div>
        ) : (
          <div style={{ maxHeight: '240px', overflowY: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Date</th>
                  <th style={{ padding: '8px 12px' }}>Type</th>
                  <th style={{ padding: '8px 12px' }}>Points</th>
                  <th style={{ padding: '8px 12px' }}>Details / Note</th>
                  <th style={{ padding: '8px 12px' }}>Staff</th>
                </tr>
              </thead>
              <tbody>
                {loyaltyData.transactions.map((txn) => {
                  const isPositive = txn.pointsDelta > 0;
                  return (
                    <tr key={txn.id} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                      <td style={{ padding: '8px 12px', color: 'var(--color-text-primary)' }}>
                        {new Date(txn.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span
                          style={{
                            backgroundColor: isPositive ? 'rgba(39, 174, 96, 0.15)' : 'rgba(231, 76, 60, 0.15)',
                            color: isPositive ? 'var(--color-success)' : 'var(--color-danger)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '10px',
                          }}
                        >
                          {txn.type}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 800, color: isPositive ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {isPositive ? `+${txn.pointsDelta}` : txn.pointsDelta} pts
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--color-text-primary)' }}>
                        {txn.bill ? (
                          <span>
                            Bill #{txn.bill.invoiceNumber} ({txn.bill.financialYear})
                          </span>
                        ) : (
                          txn.note || '—'
                        )}
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>
                        {txn.staff?.username || 'System'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Adjust Modal */}
      {showAdjustModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', width: '100%', maxWidth: '420px', boxShadow: 'var(--shadow-card)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-base)', color: 'var(--color-brand)', fontWeight: 800 }}>Manual Points Adjustment</h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '11px', color: 'var(--color-text-secondary)' }}>Add goodwill points (+) or deduct points (-). Mandatory note required.</p>

            {adjustError && (
              <div style={{ backgroundColor: 'rgba(231, 76, 60, 0.15)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', padding: '8px 12px', borderRadius: 'var(--radius-md)', marginBottom: '12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} /> {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Points Change (+ for add, - for deduct)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 50 or -20"
                  value={adjustPointsDelta}
                  onChange={(e) => setAdjustPointsDelta(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Mandatory Reason / Note
                </label>
                <Input
                  placeholder="e.g. Goodwill credit for long waiting time"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <Button type="button" variant="secondary" onClick={() => setShowAdjustModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={adjusting}>
                  {adjusting ? 'Submitting...' : 'Submit Adjustment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
