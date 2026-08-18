import { useState, useEffect } from 'react';
import { useBilling } from '../hooks/useBilling';
import { exportFileApi } from '../../../lib/apiClient';
import { FilterBar } from '../../../components/ui/FilterBar';
import { ListRow } from '../../../components/ui/ListRow';
import { BillDetailModal } from './BillDetailModal';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Download, Calendar } from 'lucide-react';
import styles from './BillsHistoryManager.module.css';

export function BillsHistoryManager() {
  const { bills, isLoading, error, loadBillsList, loadBill } = useBilling();

  // Search, Filter & Sort State
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [sort, setSort] = useState('createdAt_desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeModalBill, setActiveModalBill] = useState(null);

  useEffect(() => {
    loadBillsList({ search, paymentStatus, sort, dateFrom, dateTo });
  }, [loadBillsList, search, paymentStatus, sort, dateFrom, dateTo]);

  const handleOpenDetail = async (bill) => {
    try {
      const fullBill = await loadBill(bill.id);
      setActiveModalBill(fullBill || bill);
    } catch (err) {
      setActiveModalBill(bill);
    }
  };

  const handleExportCsv = async () => {
    try {
      const query = new URLSearchParams();
      if (dateFrom) query.append('dateFrom', dateFrom);
      if (dateTo) query.append('dateTo', dateTo);

      const filename = `bills_export_${dateFrom || 'all'}_to_${dateTo || 'today'}.csv`;
      await exportFileApi(`/bills/export?${query.toString()}`, filename);
    } catch (err) {
      alert(err.message);
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

  const getBadgeVariant = (bill) => {
    if (bill.voidedAt) return 'danger';
    switch (bill.paymentStatus) {
      case 'PAID': return 'success';
      case 'PARTIALLY_PAID': return 'warning';
      case 'UNPAID': default: return 'danger';
    }
  };

  const getBadgeText = (bill) => {
    if (bill.voidedAt) return 'VOIDED';
    return bill.paymentStatus;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Bill History & Settlements</h2>
          <p className={styles.subtitle}>Filter past bills by date range, inspect breakdowns, and export accountant CSV reports</p>
        </div>
        <Button onClick={handleExportCsv} variant="secondary">
          <Download size={16} /> Export Bills CSV
        </Button>
      </div>

      {/* Date Range Picker Bar */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', backgroundColor: 'var(--color-surface)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <Calendar size={18} color="var(--color-brand)" />
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Date Range:</span>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="From Date"
          style={{ fontSize: 'var(--text-xs)', padding: '6px 10px' }}
        />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>to</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="To Date"
          style={{ fontSize: 'var(--text-xs)', padding: '6px 10px' }}
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer' }}
          >
            Clear Dates
          </button>
        )}
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
          No bills found matching selected search or date range criteria.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {bills.map((bill) => {
            const shortId = typeof bill.invoiceNumber === 'number'
              ? `Invoice #${bill.invoiceNumber} (${bill.financialYear || ''})`
              : `#${bill.id.slice(-6).toUpperCase()}`;
            const custText = bill.customer ? `${bill.customer.name} (${bill.customer.phone})` : 'Walk-in Customer';

            return (
              <ListRow
                key={bill.id}
                title={shortId}
                subtitle={`${bill.table?.name || 'Table'} • ${custText}`}
                badgeText={getBadgeText(bill)}
                badgeVariant={getBadgeVariant(bill)}
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

      {/* Bill Detail Modal with In-Place Payment & Voiding */}
      {activeModalBill && (
        <BillDetailModal
          bill={activeModalBill}
          onClose={() => setActiveModalBill(null)}
          onRefresh={() => loadBillsList({ search, paymentStatus, sort, dateFrom, dateTo })}
        />
      )}
    </div>
  );
}
