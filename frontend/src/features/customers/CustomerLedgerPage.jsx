import React, { useState, useEffect } from 'react';
import styles from './CustomerLedgerPage.module.css';
import { apiClient, exportFileApi } from '../../lib/apiClient';

export default function CustomerLedgerPage({ customerId, onBack }) {
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLedger = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient(`/customers/${customerId}/ledger`);
      setLedger(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch customer ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) fetchLedger();
  }, [customerId]);

  const handleExportCsv = async () => {
    try {
      await exportFileApi(
        `/customers/${customerId}/ledger/export`,
        `customer-ledger-${ledger?.customer?.name || customerId}.csv`
      );
    } catch (err) {
      alert('Failed to export ledger CSV: ' + err.message);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          {onBack && (
            <button className={styles.backBtn} onClick={onBack}>
              ← Back
            </button>
          )}
          <h2>
            Customer Ledger: {ledger?.customer?.name || 'Loading...'}
          </h2>
          {ledger?.customer?.phone && (
            <span className={styles.phoneTag}>📞 {ledger.customer.phone}</span>
          )}
        </div>

        <div className={styles.headerActions}>
          <button className={styles.exportBtn} onClick={handleExportCsv} disabled={!ledger}>
            📥 Export Ledger CSV
          </button>
        </div>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading Customer Ledger...</div>
      ) : ledger ? (
        <>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Total Billed</span>
              <span className={styles.metricValue}>
                ₹{(ledger.totalBilled / 100).toFixed(2)}
              </span>
            </div>

            <div className={`${styles.metricCard} ${styles.paidCard}`}>
              <span className={styles.metricLabel}>Total Paid</span>
              <span className={styles.metricValue}>
                ₹{(ledger.totalPaid / 100).toFixed(2)}
              </span>
            </div>

            <div className={`${styles.metricCard} ${ledger.outstandingBalance > 0 ? styles.dueCard : ''}`}>
              <span className={styles.metricLabel}>Outstanding Balance</span>
              <span className={styles.metricValue}>
                ₹{(ledger.outstandingBalance / 100).toFixed(2)}
              </span>
            </div>
          </div>

          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h3>Chronological Transaction History</h3>
              <span className={styles.countBadge}>{ledger.entries?.length || 0} transactions</span>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Reference</th>
                    <th style={{ textAlign: 'right' }}>Billed (₹)</th>
                    <th style={{ textAlign: 'right' }}>Paid (₹)</th>
                    <th style={{ textAlign: 'right' }}>Balance Owed (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.entries && ledger.entries.length > 0 ? (
                    ledger.entries.map((entry) => {
                      const isBill = entry.type === 'BILL';
                      return (
                        <tr key={entry.id}>
                          <td className={styles.timeCell}>
                            {new Date(entry.timestamp).toLocaleString()}
                          </td>
                          <td>
                            <span className={`${styles.typeBadge} ${isBill ? styles.badgeBill : styles.badgePayment}`}>
                              {entry.type}
                            </span>
                          </td>
                          <td className={styles.refCell}>{entry.reference}</td>
                          <td className={`${styles.numCell} ${styles.debitCell}`}>
                            {entry.debit > 0 ? `+₹${(entry.debit / 100).toFixed(2)}` : '—'}
                          </td>
                          <td className={`${styles.numCell} ${styles.creditCell}`}>
                            {entry.credit > 0 ? `-₹${(entry.credit / 100).toFixed(2)}` : '—'}
                          </td>
                          <td className={`${styles.numCell} ${styles.balanceCell}`}>
                            ₹{(entry.balanceAfter / 100).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className={styles.emptyCell}>
                        No ledger history found for this customer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
