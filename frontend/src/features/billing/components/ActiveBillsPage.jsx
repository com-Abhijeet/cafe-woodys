import { useState, useEffect } from 'react';
import { fetchActiveUnbilledOrdersApi } from '../api/activeBills.api';
import { FilterBar } from '../../../components/ui/FilterBar';
import { ListRow } from '../../../components/ui/ListRow';
import { BillPreview } from '../../tables/components/BillPreview';
import { TableWorkspaceModal } from '../../tables/components/TableWorkspaceModal';
import { ParcelWorkspaceModal } from '../../tables/components/ParcelWorkspaceModal';
import { Receipt, Clock, ChevronRight, Eye } from 'lucide-react';

export function ActiveBillsPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & Search State
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('elapsed_desc');

  // Selected Order for Billing Checkout Workspace
  const [selectedOrderForBilling, setSelectedOrderForBilling] = useState(null);

  // Active Workspace Modal State when staff click "Edit Order / Add Items"
  const [activeTableWorkspace, setActiveTableWorkspace] = useState(null);
  const [activeParcelWorkspace, setActiveParcelWorkspace] = useState(false);

  const loadActiveOrders = async () => {
    setIsLoading(true);
    try {
      const data = await fetchActiveUnbilledOrdersApi(typeFilter.toLowerCase());
      setOrders(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load active unbilled orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActiveOrders();
    const interval = setInterval(loadActiveOrders, 10000); // Live refresh every 10s
    return () => clearInterval(interval);
  }, [typeFilter]);

  // Filtering & Sorting
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const orderNumMatch = o.dailyOrderNumber?.toString().includes(q);
    const tableMatch = o.table?.name?.toLowerCase().includes(q);
    const customerMatch = o.customer?.name?.toLowerCase().includes(q) || o.customer?.phone?.includes(q);
    return orderNumMatch || tableMatch || customerMatch;
  });

  filteredOrders.sort((a, b) => {
    if (sortBy === 'elapsed_desc') return (b.elapsedTimeMinutes || 0) - (a.elapsedTimeMinutes || 0);
    if (sortBy === 'elapsed_asc') return (a.elapsedTimeMinutes || 0) - (b.elapsedTimeMinutes || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const totalUnbilledAmount = filteredOrders.reduce((sum, o) => sum + (o.foodTotal || 0), 0);

  const handleOpenEditOrderWorkspace = (ord) => {
    if (ord.table) {
      setActiveTableWorkspace(ord.table);
    } else {
      setActiveParcelWorkspace(true);
    }
    setSelectedOrderForBilling(null);
  };

  return (
    <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', height: '100%', boxSizing: 'border-box' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Receipt size={28} color="var(--color-brand)" />
          <div>
            <h2 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-brand)' }}>
              Active Unbilled Orders ({filteredOrders.length})
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              All open table and takeaway orders awaiting billing checkout (Tap any row to view or edit)
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
            UNBILLED FOOD TOTAL
          </div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-brand)' }}>
            ₹{(totalUnbilledAmount / 100).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search order #, table, or customer..."
        filterOptions={[
          { label: 'All Active Orders', value: 'ALL' },
          { label: 'Dine-In Tables', value: 'DINE-IN' },
          { label: 'Parcel / Takeaway', value: 'PARCEL' }
        ]}
        selectedFilter={typeFilter}
        onFilterChange={setTypeFilter}
        sortOptions={[
          { label: 'Elapsed Time (Oldest Unbilled First)', value: 'elapsed_desc' },
          { label: 'Elapsed Time (Newest First)', value: 'elapsed_asc' }
        ]}
        selectedSort={sortBy}
        onSortChange={setSortBy}
      />

      {/* List Content */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', padding: 'var(--space-3)' }}>
        {isLoading && orders.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            Loading active unbilled orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            🎉 No active unbilled orders found! All current orders have been billed and settled.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredOrders.map((ord) => {
              const isParcel = ord.orderType === 'PARCEL' || !ord.table;
              const locationLabel = isParcel
                ? 'TAKEAWAY'
                : `Table ${ord.table?.name || 'Dine-In'}`;

              return (
                <div key={ord.id} onClick={() => setSelectedOrderForBilling(ord)} style={{ cursor: 'pointer' }}>
                  <ListRow
                    title={`Order #${ord.dailyOrderNumber || ord.id.slice(-4).toUpperCase()}`}
                    subtitle={`${locationLabel} • ${ord.itemCount || 0} item(s) • ${ord.customer ? ord.customer.name : 'Walk-in Customer'}`}
                    badgeText={ord.kitchenStatus || 'PENDING'}
                    badgeVariant={ord.kitchenStatus === 'READY' ? 'success' : ord.kitchenStatus === 'PREPARING' ? 'info' : 'warning'}
                    meta={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {ord.elapsedTimeMinutes || 0}m elapsed
                        </span>

                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-brand)' }}>
                          ₹{((ord.foodTotal || 0) / 100).toFixed(2)}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderForBilling(ord);
                          }}
                          style={{
                            backgroundColor: 'var(--color-brand)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            padding: '6px 12px',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Eye size={14} /> Checkout <ChevronRight size={14} />
                        </button>
                      </div>
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Screen Bill Checkout Workspace */}
      {selectedOrderForBilling && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'var(--color-bg)' }}>
          <BillPreview
            table={{
              id: selectedOrderForBilling.table?.id || selectedOrderForBilling.id,
              name: selectedOrderForBilling.table?.name || `Order #${selectedOrderForBilling.dailyOrderNumber || ''}`,
              zone: selectedOrderForBilling.table?.zone || { name: selectedOrderForBilling.orderType === 'PARCEL' ? 'PARCEL / TAKEAWAY' : 'DINE-IN' }
            }}
            initialBill={selectedOrderForBilling}
            onBackToOrdering={() => setSelectedOrderForBilling(null)}
            onRefreshTable={loadActiveOrders}
          />
        </div>
      )}

      {/* Table Workspace Modal when staff click "Edit Order" for a Dine-in Table */}
      {activeTableWorkspace && (
        <TableWorkspaceModal
          table={activeTableWorkspace}
          onClose={() => {
            setActiveTableWorkspace(null);
            loadActiveOrders();
          }}
          onRefreshTable={loadActiveOrders}
        />
      )}

      {/* Parcel Workspace Modal when staff click "Edit Order" for a Takeaway Order */}
      {activeParcelWorkspace && (
        <ParcelWorkspaceModal
          existingOrder={activeParcelWorkspace}
          onClose={() => {
            setActiveParcelWorkspace(null);
            loadActiveOrders();
          }}
          onRefreshTable={loadActiveOrders}
        />
      )}
    </div>
  );
}
