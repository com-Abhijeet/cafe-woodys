import React, { useState, useEffect } from 'react';
import styles from './AllBalancesPage.module.css';
import { apiClient } from '../../lib/apiClient';

export default function CustomerBalancesPage({ onSelectCustomer }) {
  const [balances, setBalances] = useState([]);
  const [sort, setSort] = useState('balance');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBalances = async (sortOption) => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient(`/customers/balances?sort=${sortOption}`);
      setBalances(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch customer balances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances(sort);
  }, [sort]);

  const filteredBalances = balances.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q));
  });

  const totalOutstanding = balances.reduce((sum, c) => sum + c.outstandingBalance, 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Customer Outstanding Balances</h2>
          <p>All customers with credit or unpaid bills at a glance</p>
        </div>

        <div className={styles.summaryBadge}>
          <span>Total Outstanding Owed:</span>
          <strong>₹{(totalOutstanding / 100).toFixed(2)}</strong>
        </div>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by name or phone..."
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
            Customer Name
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading balances...</div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone Number</th>
                <th style={{ textAlign: 'right' }}>Total Billed (₹)</th>
                <th style={{ textAlign: 'right' }}>Total Paid (₹)</th>
                <th style={{ textAlign: 'right' }}>Outstanding Due (₹)</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBalances.length > 0 ? (
                filteredBalances.map((item) => (
                  <tr
                    key={item.customerId}
                    className={item.outstandingBalance > 0 ? styles.dueRow : ''}
                    onClick={() => onSelectCustomer && onSelectCustomer(item.customerId)}
                  >
                    <td className={styles.nameCell}>
                      <strong>{item.name}</strong>
                    </td>
                    <td className={styles.phoneCell}>{item.phone || '—'}</td>
                    <td className={styles.numCell}>₹{(item.totalBilled / 100).toFixed(2)}</td>
                    <td className={`${styles.numCell} ${styles.paidCell}`}>₹{(item.totalPaid / 100).toFixed(2)}</td>
                    <td className={`${styles.numCell} ${styles.dueCell}`}>
                      ₹{(item.outstandingBalance / 100).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className={styles.ledgerBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectCustomer) onSelectCustomer(item.customerId);
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
                    No customers found matching your criteria.
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
