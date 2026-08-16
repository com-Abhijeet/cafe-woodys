import { useState } from 'react';
import { usePurchases } from '../hooks/usePurchases';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { X, Truck, CheckCircle2, Clock, Plus, CreditCard, Building2 } from 'lucide-react';
import styles from '../../billing/components/CheckoutModal.module.css';

export function PurchaseOrderDetailModal({ po: initialPO, onClose, onRefresh }) {
  const { addSupplierPayment, getPODetail } = usePurchases();
  const [activePO, setActivePO] = useState(initialPO);

  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [payAmountRs, setPayAmountRs] = useState(
    activePO ? (activePO.remainingBalance / 100).toFixed(2) : ''
  );
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  if (!activePO) return null;

  const isPaid = activePO.paymentStatus === 'PAID';

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setActionError('');

    const amountPaise = Math.round(parseFloat(payAmountRs) * 100);
    if (!amountPaise || amountPaise <= 0) {
      setActionError('Please enter a valid payment amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await addSupplierPayment(activePO.id, {
        amount: amountPaise,
        method: paymentMethod,
        reference
      });
      setActivePO(updated);
      setReference('');
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck color="var(--color-brand)" size={22} />
            <div>
              <h2 className={styles.title}>Purchase Order #{activePO.id.slice(-6).toUpperCase()}</h2>
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                Supplier: {activePO.supplier?.name} • Created {new Date(activePO.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Left Column: PO Items Breakdown */}
          <div className={styles.billSummary}>
            {/* Supplier Details */}
            {activePO.supplier && (
              <div style={{ backgroundColor: 'var(--color-bg)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', marginBottom: '10px', fontSize: 'var(--text-xs)' }}>
                <span style={{ color: 'var(--color-brand)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={14} /> Supplier: {activePO.supplier.name} (📞 {activePO.supplier.phone || 'N/A'})
                </span>
                {activePO.supplier.address && (
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    Address: {activePO.supplier.address}
                  </div>
                )}
              </div>
            )}

            {/* Line Items List */}
            <div className={styles.lineSection}>
              <div className={styles.lineTitle}>
                <span>Stock-In Items Received ({activePO.items?.length || 0})</span>
                <span>Total Cost: ₹{(activePO.totalCost / 100).toFixed(2)}</span>
              </div>
              {activePO.items?.map((i) => (
                <div key={i.id} className={styles.lineItem}>
                  <span>{i.quantity} {i.inventoryItem?.unit || 'units'} <strong>{i.inventoryItem?.name || 'Raw Material'}</strong></span>
                  <span>₹{((i.costPerUnit * i.quantity) / 100).toFixed(2)} (₹{(i.costPerUnit / 100).toFixed(2)}/unit)</span>
                </div>
              ))}
            </div>

            {/* Total Cost Banner */}
            <div className={styles.totalBanner}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Total Supplier Cost
                </span>
                <span className={styles.grandTotal}>
                  ₹{(activePO.totalCost / 100).toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                <span>Paid So Far: ₹{((activePO.totalPaid || 0) / 100).toFixed(2)}</span>
                <span style={{ fontWeight: 700, color: isPaid ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  Balance Due: ₹{((activePO.remainingBalance || 0) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: In-Place Supplier Payment Action */}
          <div className={styles.paymentPanel}>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-brand)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={18} /> Outgoing Supplier Payment
            </div>

            {actionError && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{actionError}</div>}

            {isPaid ? (
              <div className={styles.paidSuccessBox}>
                <CheckCircle2 size={36} />
                <div>Purchase Order Fully Settled & Paid</div>
              </div>
            ) : (
              <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                    Payment Method
                  </label>
                  <div className={styles.methodSelector} style={{ marginTop: '4px' }}>
                    {['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        className={`${styles.methodBtn} ${paymentMethod === m ? styles.activeMethod : ''}`}
                        onClick={() => setPaymentMethod(m)}
                        style={{ fontSize: '10px', padding: '4px 6px' }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Payment Amount (₹)"
                  type="number"
                  step="0.01"
                  value={payAmountRs}
                  onChange={(e) => setPayAmountRs(e.target.value)}
                  required
                />

                <Input
                  label="Reference / Cheque / Txn Note (optional)"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. Bank Ref # or Cheque No."
                />

                <Button type="submit" disabled={isSubmitting} fullWidth>
                  <Plus size={14} /> {isSubmitting ? 'Recording...' : `Pay ₹${payAmountRs || 0} to Supplier`}
                </Button>
              </form>
            )}

            {/* Payments History List */}
            {activePO.payments?.length > 0 && (
              <div style={{ marginTop: 'var(--space-3)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Supplier Payments History ({activePO.payments.length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                  {activePO.payments.map((p) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', padding: '6px 10px', backgroundColor: 'var(--color-surface)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                      <div>
                        <strong>{p.method}</strong> {p.reference ? `(${p.reference})` : ''}
                        <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                          {new Date(p.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, color: 'var(--color-success)' }}>₹{(p.amount / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
