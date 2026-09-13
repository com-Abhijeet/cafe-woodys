import React, { useState, useEffect } from 'react';
import styles from './AllBalancesPage.module.css';
import { apiClient } from '../../lib/apiClient';

export default function SupplierBalancesPage({ onSelectSupplier }) {
  const [balances, setBalances] = useState([]);
  const [sort, setSort] = useState('balance');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBalances = async (sortOption) => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient(`/suppliers/balances?sort=${sortOption}`);
      setBalances(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch supplier balances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances(sort);
  }, [sort]);

  const filteredBalances = balances.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.phone && s.phone.includes(q));
  });

  const totalOutstanding = balances.reduce((sum, s) => sum + s.outstandingBalance, 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Supplier Outstanding Balances</h2>
          <p>All suppliers with outstanding payments or credit POs at a glance</p>
        </div>

        <div className={styles.summaryBadge}>
          <span>Total Owed to Suppliers:</span>
          <strong>₹{(totalOutstanding / 100).toFixed(2)}</strong>
        </div>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search supplier name or phone..."
          className={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className={styles.sortToggle}>
          <label>Sort By:</label>
          <button
            className={`${styles.sortBtn} ${sort === 'balance' ? styles.activeSort : ''}`}
            onClick={() => setSort('balance')}
          >
            Highest Balance Owed
          </button>
          <button
            className={`${styles.sortBtn} ${sort === 'name' ? styles.activeSort : ''}`}
            onClick={() => setSort('name')}
          >
            Supplier Name
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading supplier balances...</div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Phone Number</th>
                <th style={{ textAlign: 'right' }}>Total Ordered (₹)</th>
                <th style={{ textAlign: 'right' }}>Total Paid (₹)</th>
                <th style={{ textAlign: 'right' }}>Outstanding Owed (₹)</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBalances.length > 0 ? (
                filteredBalances.map((item) => (
                  <tr
                    key={item.supplierId}
                    className={item.outstandingBalance > 0 ? styles.dueRow : ''}
                    onClick={() => onSelectSupplier && onSelectSupplier(item.supplierId)}
                  >
                    <td className={styles.nameCell}>
                      <strong>{item.name}</strong>
                    </td>
                    <td className={styles.phoneCell}>{item.phone || '—'}</td>
                    <td className={styles.numCell}>₹{(item.totalOrdered / 100).toFixed(2)}</td>
                    <td className={`${styles.numCell} ${styles.paidCell}`}>₹{(item.totalPaid / 100).toFixed(2)}</td>
                    <td className={`${styles.numCell} ${styles.dueCell}`}>
                      ₹{(item.outstandingBalance / 100).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className={styles.ledgerBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectSupplier) onSelectSupplier(item.supplierId);
                        }}
                      >
                        View Ledger →
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className={styles.emptyCell}>
                    No suppliers found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
