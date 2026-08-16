import { useState, useEffect } from 'react';
import { usePayments } from '../hooks/usePayments';
import { useBilling } from '../../billing/hooks/useBilling';
import { FilterBar } from '../../../components/ui/FilterBar';
import { ListRow } from '../../../components/ui/ListRow';
import { BillDetailModal } from '../../billing/components/BillDetailModal';
import styles from './PaymentsManager.module.css';

export function PaymentsManager() {
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('ALL');
  const [sort, setSort] = useState('paidAt_desc');
  const [activeBillModal, setActiveBillModal] = useState(null);

  const { payments, summary, isLoading, error, refreshPayments } = usePayments();
  const { loadBill } = useBilling();

  useEffect(() => {
    refreshPayments({ search, method, sort });
  }, [refreshPayments, search, method, sort]);

  const handleCardClick = async (payment) => {
    if (!payment.bill?.id) return;
    try {
      const fullBill = await loadBill(payment.bill.id);
      setActiveBillModal(fullBill || payment.bill);
    } catch (err) {
      setActiveBillModal(payment.bill);
    }
  };

  const filterDefinitions = [
    {
      key: 'method',
      label: 'Method',
      options: [
        { value: 'ALL', label: 'All Methods' },
        { value: 'CASH', label: 'Cash' },
        { value: 'UPI', label: 'UPI' },
        { value: 'CARD', label: 'Card' },
        { value: 'OTHER', label: 'Other' }
      ]
    }
  ];

  const sortOptions = [
    { value: 'paidAt_desc', label: 'Newest First' },
    { value: 'paidAt_asc', label: 'Oldest First' },
    { value: 'amount_desc', label: 'Highest Amount' },
    { value: 'amount_asc', label: 'Lowest Amount' }
  ];

  const getMethodBadgeVariant = (m) => {
    switch (m) {
      case 'CASH': return 'success';
      case 'UPI': return 'info';
      case 'CARD': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Payments & Cash-Up Reconciliation Log</h2>
          <p className={styles.subtitle}>Flat chronological audit of every customer payment received across all tables</p>
        </div>
      </div>

      {/* Daily Cash-Up Summary Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: 'var(--color-brand)' }}>
            ₹{((summary.totalAmountPaise || 0) / 100).toFixed(2)}
          </span>
          <span className={styles.statLabel}>Total Revenue ({summary.totalCount || 0} Txns)</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: 'var(--color-success)' }}>
            ₹{((summary.todayTotalPaise || 0) / 100).toFixed(2)}
          </span>
          <span className={styles.statLabel}>Today's Revenue ({summary.todayCount || 0} Txns)</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: 'var(--color-success)' }}>
            ₹{((summary.cashTotalPaise || 0) / 100).toFixed(2)}
          </span>
          <span className={styles.statLabel}>Total Cash Collected</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: 'var(--color-gaming-zone)' }}>
            ₹{((summary.upiTotalPaise || 0) / 100).toFixed(2)}
          </span>
          <span className={styles.statLabel}>Total UPI / Online</span>
        </div>
      </div>

      {/* FilterBar Component */}
      <FilterBar
        searchPlaceholder="Search payments by customer name, phone, table, or bill ID..."
        searchValue={search}
        onSearchChange={setSearch}
        filterDefinitions={filterDefinitions}
        filterValues={{ method }}
        onFilterChange={(key, val) => setMethod(val)}
        sortOptions={sortOptions}
        sortValue={sort}
        onSortChange={setSort}
      />

      {/* Payment List Rows */}
      {isLoading && payments.length === 0 ? (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loading payments log...</p>
      ) : error ? (
        <p style={{ color: 'var(--color-danger)' }}>{error}</p>
      ) : payments.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--color-bg)', borderRadius: '8px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          No payments found matching selected filter criteria.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {payments.map((p) => {
            const shortBillId = p.bill?.id ? `#${p.bill.id.slice(-6).toUpperCase()}` : 'Bill';
            const custText = p.bill?.customer ? `${p.bill.customer.name}` : 'Walk-in Customer';

            return (
              <ListRow
                key={p.id}
                title={`₹${(p.amount / 100).toFixed(2)} ${p.method}`}
                subtitle={`Bill ${shortBillId} • ${p.bill?.table?.name || 'Table'} • Customer: ${custText}`}
                badgeText={p.method}
                badgeVariant={getMethodBadgeVariant(p.method)}
                onClick={() => handleCardClick(p)}
                fields={[
                  { label: 'Paid At', value: new Date(p.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                  { label: 'Customer', value: custText },
                  { label: 'Staff Recorded', value: p.bill?.staff?.username || 'Staff' },
                  { label: 'Ref Note', value: p.reference || 'None' }
                ]}
              />
            );
          })}
        </div>
      )}

      {/* Parent Bill Detail Modal */}
      {activeBillModal && (
        <BillDetailModal
          bill={activeBillModal}
          onClose={() => setActiveBillModal(null)}
          onRefresh={() => refreshPayments({ search, method, sort })}
        />
      )}
    </div>
  );
}
