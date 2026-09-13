import React, { useState, useEffect } from 'react';
import styles from './DaybookPage.module.css';
import CashMovementModal from './CashMovementModal';
import { apiClient, exportFileApi } from '../../lib/apiClient';

export default function DaybookPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [daybookData, setDaybookData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [initialCashRs, setInitialCashRs] = useState('');

  const fetchDaybook = async (date) => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient(`/daybook?date=${date}`);
      setDaybookData(data);
    } catch (err) {
      setError(err.message || 'Failed to load daybook data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDaybook(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleExportCsv = async () => {
    try {
      await exportFileApi(
        `/daybook/export?dateFrom=${selectedDate}&dateTo=${selectedDate}`,
        `daybook-${selectedDate}.csv`
      );
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  const handleCashMovementSubmit = async (payload) => {
    await apiClient('/cash-transactions', { method: 'POST', body: payload });
    fetchDaybook(selectedDate);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const paise = Math.round(parseFloat(initialCashRs || 0) * 100);
    try {
      await apiClient('/daybook/settings', { method: 'PUT', body: { initialCashBalance: paise } });
      setIsSettingsOpen(false);
      fetchDaybook(selectedDate);
    } catch (err) {
      alert(err.message || 'Failed to update initial cash balance');
    }
  };

  const openSettingsModal = async () => {
    try {
      const settings = await apiClient('/daybook/settings');
      setInitialCashRs(((settings.initialCashBalance || 0) / 100).toString());
      setIsSettingsOpen(true);
    } catch (err) {
      alert('Failed to fetch settings: ' + err.message);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Daybook & Cash Ledger</h2>
          <p>Daily cash flow, opening/closing reconciliation & petty cash</p>
        </div>

        <div className={styles.headerControls}>
          <input
            type="date"
            className={styles.datePicker}
            value={selectedDate}
            onChange={handleDateChange}
          />
          <button className={styles.exportBtn} onClick={handleExportCsv}>
            📥 Export CSV
          </button>

          <button className={styles.settingsBtn} onClick={openSettingsModal} title="Configure Initial Cash Balance">
            ⚙️ Setup Starting Cash
          </button>

          <button className={styles.addCashBtn} onClick={() => setIsCashModalOpen(true)}>
            + Add Cash Movement
          </button>
        </div>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading Daybook Data...</div>
      ) : daybookData ? (
        <>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Opening Cash Balance</span>
              <span className={styles.metricValue}>
                ₹{((daybookData.openingBalance || 0) / 100).toFixed(2)}
              </span>
            </div>

            <div className={`${styles.metricCard} ${styles.inCard}`}>
              <span className={styles.metricLabel}>Total Cash In</span>
              <span className={styles.metricValue}>
                +₹{((daybookData.totalIn || 0) / 100).toFixed(2)}
              </span>
            </div>

            <div className={`${styles.metricCard} ${styles.outCard}`}>
              <span className={styles.metricLabel}>Total Cash Out</span>
              <span className={styles.metricValue}>
                -₹{((daybookData.totalOut || 0) / 100).toFixed(2)}
              </span>
            </div>

            <div className={`${styles.metricCard} ${styles.closingCard}`}>
              <span className={styles.metricLabel}>Closing Cash Balance</span>
              <span className={styles.metricValue}>
                ₹{((daybookData.closingBalance || 0) / 100).toFixed(2)}
              </span>
            </div>
          </div>

          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h3>Transactions for {new Date(selectedDate).toLocaleDateString()}</h3>
              <span className={styles.countBadge}>{daybookData.entries?.length || 0} entries</span>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Staff / Ref</th>
                    <th style={{ textAlign: 'right' }}>Cash In (₹)</th>
                    <th style={{ textAlign: 'right' }}>Cash Out (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {daybookData.entries && daybookData.entries.length > 0 ? (
                    daybookData.entries.map((item) => {
                      const isCashIn = item.category === 'CASH_IN';
                      const formattedTime = new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <tr key={item.id}>
                          <td className={styles.timeCell}>{formattedTime}</td>
                          <td>
                            <span className={`${styles.typeBadge} ${isCashIn ? styles.badgeIn : styles.badgeOut}`}>
                              {item.type}
                            </span>
                          </td>
                          <td className={styles.descCell}>{item.description}</td>
                          <td className={styles.refCell}>{item.staff || item.reference || '—'}</td>
                          <td className={`${styles.amountCell} ${styles.amountIn}`}>
                            {isCashIn ? `+₹${(item.amount / 100).toFixed(2)}` : '—'}
                          </td>
                          <td className={`${styles.amountCell} ${styles.amountOut}`}>
                            {!isCashIn ? `-₹${(item.amount / 100).toFixed(2)}` : '—'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className={styles.emptyCell}>
                        No cash transactions recorded for this date.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      <CashMovementModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        onSubmit={handleCashMovementSubmit}
      />

      {isSettingsOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsSettingsOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3>Daybook Starting Cash Balance</h3>
            <p>Set the cash-in-hand amount present on the day this system started being used.</p>
            <form onSubmit={handleSaveSettings}>
              <div className={styles.inputGroup}>
                <label>Initial Cash Balance (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={initialCashRs}
                  onChange={(e) => setInitialCashRs(e.target.value)}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsSettingsOpen(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Save Settings</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
