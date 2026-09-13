import { useState, useCallback, useEffect } from 'react';
import { usePurchases } from '../hooks/usePurchases';
import { useSuppliers } from '../hooks/useSuppliers';
import { useInventory } from '../../inventory/hooks/useInventory';
import { exportFileApi } from '../../../lib/apiClient';
import { FilterBar } from '../../../components/ui/FilterBar';
import { EntityCard } from '../../../components/ui/EntityCard';
import { ListRow } from '../../../components/ui/ListRow';
import { PurchaseOrderDetailModal } from './PurchaseOrderDetailModal';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { Truck, ShoppingCart, Plus, CreditCard, Trash2, Building2, Download, Calendar } from 'lucide-react';
import styles from './PurchaseManager.module.css';

export function PurchaseManager({ onOpenBalances, onOpenLedger }) {
  const [activeTab, setActiveTab] = useState('PURCHASES'); // 'PURCHASES' | 'PAYMENTS' | 'SUPPLIERS'

  const { suppliers, addSupplier, removeSupplier } = useSuppliers();
  const {
    purchaseOrders,
    purchasePayments,
    paymentsSummary,
    isLoading,
    error,
    refreshPurchaseOrders,
    refreshPurchasePayments,
    addPurchaseOrder,
    getPODetail
  } = usePurchases();
  const { items: rawMaterials, refreshInventory } = useInventory();

  // Search, Filter & Sort states
  const [poSearch, setPoSearch] = useState('');
  const [poStatus, setPoStatus] = useState('ALL');
  const [poSort, setPoSort] = useState('createdAt_desc');
  const [poDateFrom, setPoDateFrom] = useState('');
  const [poDateTo, setPoDateTo] = useState('');

  const [paySearch, setPaySearch] = useState('');
  const [payMethod, setPayMethod] = useState('ALL');
  const [paySort, setPaySort] = useState('paidAt_desc');

  // Modals
  const [showPOModal, setShowPOModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [activeDetailPO, setActiveDetailPO] = useState(null);

  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Supplier Form State
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // Purchase Order Form State
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poLines, setPoLines] = useState([
    { inventoryItemId: '', quantity: '', costPerUnitRs: '' }
  ]);

  useEffect(() => {
    if (activeTab === 'PURCHASES') {
      refreshPurchaseOrders({ search: poSearch, paymentStatus: poStatus, sort: poSort, dateFrom: poDateFrom, dateTo: poDateTo });
    }
  }, [activeTab, refreshPurchaseOrders, poSearch, poStatus, poSort, poDateFrom, poDateTo]);

  useEffect(() => {
    if (activeTab === 'PAYMENTS') {
      refreshPurchasePayments({ search: paySearch, method: payMethod, sort: paySort });
    }
  }, [activeTab, refreshPurchasePayments, paySearch, payMethod, paySort]);

  const totalExpensePaise = purchaseOrders.reduce((sum, o) => sum + o.totalCost, 0);
  const totalUnpaidPaise = purchaseOrders.reduce((sum, o) => sum + (o.remainingBalance || 0), 0);

  const handleExportPurchasesCsv = async () => {
    try {
      const query = new URLSearchParams();
      if (poDateFrom) query.append('dateFrom', poDateFrom);
      if (poDateTo) query.append('dateTo', poDateTo);

      const filename = `purchases_export_${poDateFrom || 'all'}_to_${poDateTo || 'today'}.csv`;
      await exportFileApi(`/purchase-orders/export?${query.toString()}`, filename);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFetchFilteredPO = () => {
    refreshPurchaseOrders({ search: poSearch, paymentStatus: poStatus, sort: poSort, dateFrom: poDateFrom, dateTo: poDateTo });
  };

  // PO Line Handlers
  const handleAddLine = () => {
    setPoLines([...poLines, { inventoryItemId: '', quantity: '', costPerUnitRs: '' }]);
  };

  const handleRemoveLine = (idx) => {
    if (poLines.length === 1) return;
    setPoLines(poLines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx, field, val) => {
    const updated = [...poLines];
    updated[idx][field] = val;

    if (field === 'inventoryItemId' && val) {
      const selectedItem = rawMaterials.find((i) => i.id === val);
      if (selectedItem && !updated[idx].costPerUnitRs) {
        updated[idx].costPerUnitRs = (selectedItem.costPerUnit / 100).toString();
      }
    }
    setPoLines(updated);
  };

  const calculatePOTotalRs = () => {
    return poLines.reduce((sum, line) => {
      const q = parseFloat(line.quantity) || 0;
      const c = parseFloat(line.costPerUnitRs) || 0;
      return sum + (q * c);
    }, 0);
  };

  // Submit Handlers
  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    setActionError('');
    setIsSubmitting(true);
    try {
      await addSupplier({ name: supName, phone: supPhone, address: supAddress });
      setSupName('');
      setSupPhone('');
      setSupAddress('');
      setShowSupplierModal(false);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    setActionError('');

    if (!poSupplierId) {
      setActionError('Please select a supplier');
      return;
    }

    const items = [];
    for (const line of poLines) {
      if (!line.inventoryItemId) {
        setActionError('Select a raw material for all line items');
        return;
      }
      const q = parseFloat(line.quantity);
      const cRs = parseFloat(line.costPerUnitRs);
      if (!q || q <= 0) {
        setActionError('Quantity must be greater than 0');
        return;
      }
      if (isNaN(cRs) || cRs < 0) {
        setActionError('Cost per unit must be non-negative');
        return;
      }
      items.push({
        inventoryItemId: line.inventoryItemId,
        quantity: q,
        costPerUnit: Math.round(cRs * 100)
      });
    }

    setIsSubmitting(true);
    try {
      await addPurchaseOrder({ supplierId: poSupplierId, items });
      await refreshInventory();
      setShowPOModal(false);
      setPoSupplierId('');
      setPoLines([{ inventoryItemId: '', quantity: '', costPerUnitRs: '' }]);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPODetail = async (po) => {
    try {
      const fullPO = await getPODetail(po.id);
      setActiveDetailPO(fullPO || po);
    } catch (err) {
      setActiveDetailPO(po);
    }
  };

  const getStatusBadgeVariant = (s) => {
    switch (s) {
      case 'PAID': return 'success';
      case 'PARTIALLY_PAID': return 'warning';
      case 'UNPAID': default: return 'danger';
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Purchases & Supplier Payments</h2>
          <p className={styles.subtitle}>Manage stock-in purchase orders, supplier directory, and export procurement reports</p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {activeTab === 'PURCHASES' && (
            <Button variant="secondary" onClick={handleExportPurchasesCsv}>
              <Download size={16} /> Export Purchases CSV
            </Button>
          )}
          {activeTab === 'PURCHASES' ? (
            <Button onClick={() => { setActionError(''); setShowPOModal(true); }}>
              <Plus size={16} /> New Stock Purchase
            </Button>
          ) : activeTab === 'SUPPLIERS' ? (
            <>
              {onOpenBalances && (
                <Button variant="secondary" onClick={onOpenBalances}>
                  💳 All Balances
                </Button>
              )}
              <Button onClick={() => { setActionError(''); setShowSupplierModal(true); }}>
                <Plus size={16} /> Add Supplier
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {/* 3 Nav Sub-Tabs */}
      <div className={styles.navTabs}>
        <button
          className={`${styles.navTab} ${activeTab === 'PURCHASES' ? styles.activeNavTab : ''}`}
          onClick={() => setActiveTab('PURCHASES')}
        >
          <ShoppingCart size={16} /> Stock-In Purchase Orders ({purchaseOrders.length})
        </button>
        <button
          className={`${styles.navTab} ${activeTab === 'PAYMENTS' ? styles.activeNavTab : ''}`}
          onClick={() => setActiveTab('PAYMENTS')}
        >
          <CreditCard size={16} /> Outgoing Supplier Payments Log
        </button>
        <button
          className={`${styles.navTab} ${activeTab === 'SUPPLIERS' ? styles.activeNavTab : ''}`}
          onClick={() => setActiveTab('SUPPLIERS')}
        >
          <Truck size={16} /> Suppliers Directory ({suppliers.length})
        </button>
      </div>

      {/* TAB 1: PURCHASES LIST */}
      {activeTab === 'PURCHASES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className={styles.statsBar}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{purchaseOrders.length}</span>
              <span className={styles.statLabel}>Total Purchase Orders</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue} style={{ color: 'var(--color-brand)' }}>
                ₹{(totalExpensePaise / 100).toFixed(2)}
              </span>
              <span className={styles.statLabel}>Total Procurement Expense</span>
            </div>
            <div className={styles.statCard} style={{ borderColor: totalUnpaidPaise > 0 ? 'var(--color-danger)' : 'var(--color-border)' }}>
              <span className={styles.statValue} style={{ color: totalUnpaidPaise > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                ₹{(totalUnpaidPaise / 100).toFixed(2)}
              </span>
              <span className={styles.statLabel}>Pending Supplier Balance</span>
            </div>
          </div>

          {/* Date Range Bar */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', backgroundColor: 'var(--color-surface)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
            <Calendar size={18} color="var(--color-brand)" />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Filter Date Range:</span>
            <Input
              type="date"
              value={poDateFrom}
              onChange={(e) => setPoDateFrom(e.target.value)}
              placeholder="From Date"
              style={{ fontSize: 'var(--text-xs)', padding: '6px 10px' }}
            />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>to</span>
            <Input
              type="date"
              value={poDateTo}
              onChange={(e) => setPoDateTo(e.target.value)}
              placeholder="To Date"
              style={{ fontSize: 'var(--text-xs)', padding: '6px 10px' }}
            />
            {(poDateFrom || poDateTo) && (
              <button
                onClick={() => { setPoDateFrom(''); setPoDateTo(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer' }}
              >
                Clear Dates
              </button>
            )}
          </div>

          <FilterBar
            searchPlaceholder="Search purchase orders by supplier or PO ID..."
            searchValue={poSearch}
            onSearchChange={setPoSearch}
            filterDefinitions={[
              {
                key: 'poStatus',
                label: 'Status',
                options: [
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'PAID', label: 'Paid' },
                  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
                  { value: 'UNPAID', label: 'Unpaid' }
                ]
              }
            ]}
            filterValues={{ poStatus }}
            onFilterChange={(k, v) => setPoStatus(v)}
            sortOptions={[
              { value: 'createdAt_desc', label: 'Newest First' },
              { value: 'createdAt_asc', label: 'Oldest First' },
              { value: 'totalCost_desc', label: 'Highest Cost' },
              { value: 'totalCost_asc', label: 'Lowest Cost' }
            ]}
            sortValue={poSort}
            onSortChange={setPoSort}
          />

          {isLoading && purchaseOrders.length === 0 ? (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loading purchase orders...</p>
          ) : error ? (
            <p style={{ color: 'var(--color-danger)' }}>{error}</p>
          ) : purchaseOrders.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--color-bg)', borderRadius: '8px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              No purchase orders found matching filter criteria.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {purchaseOrders.map((po) => (
                <ListRow
                  key={po.id}
                  title={`PO #${po.id.slice(-6).toUpperCase()}`}
                  subtitle={`Supplier: ${po.supplier?.name || 'N/A'}`}
                  badgeText={po.paymentStatus}
                  badgeVariant={getStatusBadgeVariant(po.paymentStatus)}
                  onClick={() => openPODetail(po)}
                  fields={[
                    { label: 'Date', value: new Date(po.createdAt).toLocaleDateString() },
                    { label: 'Total Cost', value: `₹${(po.totalCost / 100).toFixed(2)}` },
                    { label: 'Paid', value: `₹${((po.totalPaid || 0) / 100).toFixed(2)}` },
                    { label: 'Balance Due', value: `₹${((po.remainingBalance || 0) / 100).toFixed(2)}` }
                  ]}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUPPLIER PAYMENTS LOG */}
      {activeTab === 'PAYMENTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className={styles.statsBar}>
            <div className={styles.statCard}>
              <span className={styles.statValue} style={{ color: 'var(--color-danger)' }}>
                ₹{((paymentsSummary.totalAmountPaise || 0) / 100).toFixed(2)}
              </span>
              <span className={styles.statLabel}>Total Outgoing Spend ({paymentsSummary.totalCount || 0} Txns)</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue} style={{ color: 'var(--color-brand)' }}>
                ₹{((paymentsSummary.todayTotalPaise || 0) / 100).toFixed(2)}
              </span>
              <span className={styles.statLabel}>Today's Outgoing Spend</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>
                ₹{((paymentsSummary.cashTotalPaise || 0) / 100).toFixed(2)}
              </span>
              <span className={styles.statLabel}>Paid via Cash</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue} style={{ color: 'var(--color-gaming-zone)' }}>
                ₹{((paymentsSummary.bankTotalPaise || 0) / 100).toFixed(2)}
              </span>
              <span className={styles.statLabel}>Paid via Bank / UPI</span>
            </div>
          </div>

          <FilterBar
            searchPlaceholder="Search supplier payments by reference, supplier name, or PO ID..."
            searchValue={paySearch}
            onSearchChange={setPaySearch}
            filterDefinitions={[
              {
                key: 'payMethod',
                label: 'Method',
                options: [
                  { value: 'ALL', label: 'All Methods' },
                  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                  { value: 'UPI', label: 'UPI' },
                  { value: 'CASH', label: 'Cash' },
                  { value: 'CHEQUE', label: 'Cheque' }
                ]
              }
            ]}
            filterValues={{ payMethod }}
            onFilterChange={(k, v) => setPayMethod(v)}
            sortOptions={[
              { value: 'paidAt_desc', label: 'Newest First' },
              { value: 'paidAt_asc', label: 'Oldest First' },
              { value: 'amount_desc', label: 'Highest Amount' },
              { value: 'amount_asc', label: 'Lowest Amount' }
            ]}
            sortValue={paySort}
            onSortChange={setPaySort}
          />

          {isLoading && purchasePayments.length === 0 ? (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loading supplier payments log...</p>
          ) : error ? (
            <p style={{ color: 'var(--color-danger)' }}>{error}</p>
          ) : purchasePayments.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--color-bg)', borderRadius: '8px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              No supplier payments recorded matching criteria.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {purchasePayments.map((p) => {
                const shortPO = p.purchaseOrder?.id ? `#PO-${p.purchaseOrder.id.slice(-6).toUpperCase()}` : 'PO';
                return (
                  <ListRow
                    key={p.id}
                    title={`₹${(p.amount / 100).toFixed(2)} ${p.method}`}
                    subtitle={`${shortPO} • Supplier: ${p.purchaseOrder?.supplier?.name || 'Supplier'}`}
                    badgeText={p.method}
                    badgeVariant="info"
                    onClick={() => openPODetail(p.purchaseOrder)}
                    fields={[
                      { label: 'Paid Date', value: new Date(p.paidAt).toLocaleDateString() },
                      { label: 'Supplier', value: p.purchaseOrder?.supplier?.name || 'N/A' },
                      { label: 'Method', value: p.method },
                      { label: 'Txn Ref', value: p.reference || 'None' }
                    ]}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUPPLIERS DIRECTORY */}
      {activeTab === 'SUPPLIERS' && (
        <div className={styles.grid}>
          {suppliers.map((s) => (
            <div key={s.id} className={styles.card}>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-brand)', fontWeight: 800 }}>{s.name}</h3>
                {s.phone && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>📞 {s.phone}</div>}
                {s.address && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>📍 {s.address}</div>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--color-border)', paddingTop: '8px' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Total Orders: {s._count?.purchaseOrders || 0}
                </span>
                <Button variant="danger" onClick={async () => {
                  if (confirm('Delete supplier?')) await removeSupplier(s.id);
                }} style={{ padding: '4px 8px', fontSize: 'var(--text-xs)' }}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Purchase Order Detail Modal */}
      {activeDetailPO && (
        <PurchaseOrderDetailModal
          po={activeDetailPO}
          onClose={() => setActiveDetailPO(null)}
          onRefresh={handleFetchFilteredPO}
        />
      )}

      {/* MODAL 2: Create Stock-In Purchase Order */}
      {showPOModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3>Record Stock-In Purchase Order</h3>
            {actionError && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{actionError}</div>}

            <form onSubmit={handleCreatePO} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Select Supplier</label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginTop: '4px' }}
                  required
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)' }}>Purchased Raw Material Lines</label>
                  <Button type="button" variant="secondary" onClick={handleAddLine} style={{ padding: '2px 8px', fontSize: 'var(--text-xs)' }}>
                    <Plus size={12} /> Add Item Line
                  </Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                  {poLines.map((line, idx) => {
                    const selItem = rawMaterials.find((i) => i.id === line.inventoryItemId);
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--color-bg)', padding: '8px', borderRadius: '6px' }}>
                        <select
                          value={line.inventoryItemId}
                          onChange={(e) => handleLineChange(idx, 'inventoryItemId', e.target.value)}
                          style={{ flex: 2, padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)' }}
                          required
                        >
                          <option value="">-- Raw Material --</option>
                          {rawMaterials.map((rm) => (
                            <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
                          ))}
                        </select>

                        <input
                          type="number"
                          step="0.01"
                          placeholder={`Qty ${selItem ? `(${selItem.unit})` : ''}`}
                          value={line.quantity}
                          onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                          style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)' }}
                          required
                        />

                        <input
                          type="number"
                          step="0.5"
                          placeholder="Cost (₹)"
                          value={line.costPerUnitRs}
                          onChange={(e) => handleLineChange(idx, 'costPerUnitRs', e.target.value)}
                          style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)' }}
                          required
                        />

                        {poLines.length > 1 && (
                          <button type="button" onClick={() => handleRemoveLine(idx)} style={{ border: 'none', background: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-bg)', padding: '12px', borderRadius: '6px', fontWeight: 800 }}>
                <span>Calculated Total Cost:</span>
                <span style={{ fontSize: 'var(--text-lg)', color: 'var(--color-brand)' }}>₹{calculatePOTotalRs().toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button type="button" variant="secondary" onClick={() => setShowPOModal(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Recording Purchase...' : 'Submit & Stock-In'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Create Supplier */}
      {showSupplierModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3>Add New Supplier</h3>
            {actionError && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{actionError}</div>}
            <form onSubmit={handleCreateSupplier} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input label="Supplier Company Name" value={supName} onChange={(e) => setSupName(e.target.value)} required placeholder="e.g. Woody Dairy Distributors" />
              <Input label="Phone Number (optional)" value={supPhone} onChange={(e) => setSupPhone(e.target.value)} placeholder="+91 98765 43210" />
              <Input label="Address / Office Location (optional)" value={supAddress} onChange={(e) => setSupAddress(e.target.value)} placeholder="Main Market Rd" />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="secondary" onClick={() => setShowSupplierModal(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Supplier'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
