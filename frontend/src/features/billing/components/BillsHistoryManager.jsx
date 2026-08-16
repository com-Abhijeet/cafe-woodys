import { useState, useEffect } from 'react';
import { useBilling } from '../hooks/useBilling';
import { FilterBar } from '../../../components/ui/FilterBar';
import { ListRow } from '../../../components/ui/ListRow';
import { BillDetailModal } from './BillDetailModal';
import styles from './BillsHistoryManager.module.css';

export function BillsHistoryManager() {
  const { bills, isLoading, error, loadBillsList, loadBill } = useBilling();

  // Search, Filter & Sort State
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [sort, setSort] = useState('createdAt_desc');
  const [activeModalBill, setActiveModalBill] = useState(null);

  useEffect(() => {
    loadBillsList({ search, paymentStatus, sort });
  }, [loadBillsList, search, paymentStatus, sort]);

  const handleOpenDetail = async (bill) => {
    try {
      const fullBill = await loadBill(bill.id);
      setActiveModalBill(fullBill || bill);
    } catch (err) {
      setActiveModalBill(bill);
    }
  };

  const filterDefinitions = [
    {
      key: 'paymentStatus',
      label: 'Status',
      options: [
        { value: 'ALL', label: 'All Statuses' },
        { value: 'PAID', label: 'Paid' },
        { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
        { value: 'UNPAID', label: 'Unpaid' }
      ]
    }
  ];

  const sortOptions = [
    { value: 'createdAt_desc', label: 'Newest First' },
    { value: 'createdAt_asc', label: 'Oldest First' },
    { value: 'grandTotal_desc', label: 'Highest Amount' },
    { value: 'grandTotal_asc', label: 'Lowest Amount' }
  ];

  const getBadgeVariant = (status) => {
    switch (status) {
      case 'PAID': return 'success';
      case 'PARTIALLY_PAID': return 'warning';
      case 'UNPAID': default: return 'danger';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Bill History & In-Place Settlements</h2>
          <p className={styles.subtitle}>Filter past bills, inspect itemized breakdowns, and add remaining payments directly in-place</p>
        </div>
      </div>

      {/* FilterBar Component */}
      <FilterBar
        searchPlaceholder="Search by customer name, phone, table, or bill ID..."
        searchValue={search}
        onSearchChange={setSearch}
        filterDefinitions={filterDefinitions}
        filterValues={{ paymentStatus }}
        onFilterChange={(key, val) => setPaymentStatus(val)}
        sortOptions={sortOptions}
        sortValue={sort}
        onSortChange={setSort}
      />

      {/* Bills List using ListRow */}
      {isLoading && bills.length === 0 ? (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loading bill history...</p>
      ) : error ? (
        <p style={{ color: 'var(--color-danger)' }}>{error}</p>
      ) : bills.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--color-bg)', borderRadius: '8px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          No bills found matching selected search or filter criteria.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {bills.map((bill) => {
            const shortId = `#${bill.id.slice(-6).toUpperCase()}`;
            const custText = bill.customer ? `${bill.customer.name} (${bill.customer.phone})` : 'Walk-in Customer';

            return (
              <ListRow
                key={bill.id}
                title={`Bill ${shortId}`}
                subtitle={`${bill.table?.name || 'Table'} • ${custText}`}
                badgeText={bill.paymentStatus}
                badgeVariant={getBadgeVariant(bill.paymentStatus)}
                onClick={() => handleOpenDetail(bill)}
                fields={[
                  { label: 'Date', value: new Date(bill.createdAt).toLocaleDateString() },
                  { label: 'Total Amount', value: `₹${(bill.grandTotal / 100).toFixed(2)}` },
                  { label: 'Paid So Far', value: `₹${((bill.totalPaid || 0) / 100).toFixed(2)}` },
                  { label: 'Balance Due', value: `₹${((bill.remainingBalance || 0) / 100).toFixed(2)}` }
                ]}
              />
            );
          })}
        </div>
      )}

      {/* Bill Detail Modal with In-Place Payment Marking */}
      {activeModalBill && (
        <BillDetailModal
          bill={activeModalBill}
          onClose={() => setActiveModalBill(null)}
          onRefresh={() => loadBillsList({ search, paymentStatus, sort })}
        />
      )}
    </div>
  );
}
