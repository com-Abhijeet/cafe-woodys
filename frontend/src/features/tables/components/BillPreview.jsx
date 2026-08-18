import { useState, useEffect } from 'react';
import { fetchBillPreviewApi } from '../../billing/api/billing.api';
import { useBilling } from '../../billing/hooks/useBilling';
import { CustomerResolveField } from '../../customers/components/CustomerResolveField';
import { printBillViaRawBT } from '../../../lib/rawbtPrinter';
import { KitchenStatusWarningModal } from '../../billing/components/KitchenStatusWarningModal';
import { triggerHapticNotification } from '../../../lib/native/nativeManager';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { ArrowLeft, Printer, CheckCircle2, CreditCard, Plus, Receipt } from 'lucide-react';
import styles from '../../billing/components/CheckoutModal.module.css';

export function BillPreview({ table, onBackToOrdering, onRefreshTable }) {
  const { createBill, submitPayment, attachCustomerToBill } = useBilling();

  const [previewData, setPreviewData] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);
  const [committedBill, setCommittedBill] = useState(null);

  // Quick Checkout vs Tab/Split Payment Mode Toggle
  const [recordPaymentDifferently, setRecordPaymentDifferently] = useState(false);
  const [quickPayMethod, setQuickPayMethod] = useState('CASH');

  // Step 5: Kitchen Status Warning Modal State
  const [unfinishedKitchenOrders, setUnfinishedKitchenOrders] = useState([]);
  const [showKitchenModal, setShowKitchenModal] = useState(false);

  // Settlement Form State for Multi-Payment / Tab
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [payAmountRs, setPayAmountRs] = useState('');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  // Step 6: Fetch Read-Only Bill Preview from GET /tables/:tableId/bill-preview
  useEffect(() => {
    if (!committedBill && table?.id) {
      setIsPreviewLoading(true);
      fetchBillPreviewApi(table.id)
        .then((preview) => {
          setPreviewData(preview);
          setIsPreviewLoading(false);
        })
        .catch((err) => {
          setActionError(err.message || 'Failed to load bill preview');
          setIsPreviewLoading(false);
        });
    }
  }, [committedBill, table?.id]);

  useEffect(() => {
    if (committedBill) {
      setPayAmountRs((committedBill.remainingBalance / 100).toFixed(2));
    }
  }, [committedBill]);

  const handleSelectCustomer = async (customer) => {
    if (committedBill) {
      try {
        await attachCustomerToBill(committedBill.id, customer.id);
        if (onRefreshTable) onRefreshTable();
      } catch (err) {
        setActionError(err.message);
      }
    }
  };

  const handleClearCustomer = async () => {
    if (committedBill) {
      try {
        await attachCustomerToBill(committedBill.id, null);
        if (onRefreshTable) onRefreshTable();
      } catch (err) {
        setActionError(err.message);
      }
    }
  };

  // Step 5 & 6: Explicit "Generate Bill" Commit Action
  const handleCommitBillGeneration = async (ignoreKitchenWarning = false) => {
    setActionError('');
    setIsSubmitting(true);

    try {
      const discountAmount = previewData?.discountAmount || 0;
      const discountReason = previewData?.discountReason || null;
      const autoPayMethod = recordPaymentDifferently ? null : quickPayMethod;

      // Always recomputes fresh from current OPEN orders & sessions at commit time!
      const newBill = await createBill(table.id, {
        discountAmount,
        discountReason,
        autoPayMethod,
        ignoreKitchenWarning
      });

      triggerHapticNotification();
      setCommittedBill(newBill);
      setShowKitchenModal(false);
      setUnfinishedKitchenOrders([]);

      if (newBill.paymentStatus === 'PAID') {
        printBillViaRawBT(newBill);
      }

      if (onRefreshTable) onRefreshTable();
    } catch (err) {
      if (err.code === 'KITCHEN_NOT_FINISHED' && err.data?.unfinishedOrders) {
        setUnfinishedKitchenOrders(err.data.unfinishedOrders);
        setShowKitchenModal(true);
      } else {
        setActionError(err.message || 'Failed to generate bill');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!committedBill) return;

    setActionError('');
    const amountPaise = Math.round(parseFloat(payAmountRs) * 100);
    if (!amountPaise || amountPaise <= 0) {
      setActionError('Please enter a valid payment amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await submitPayment(committedBill.id, {
        amount: amountPaise,
        method: paymentMethod,
        reference
      });
      setReference('');
      setCommittedBill(updated);
      triggerHapticNotification();

      if (updated.paymentStatus === 'PAID') {
        printBillViaRawBT(updated);
      }

      if (onRefreshTable) onRefreshTable();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReprint = () => {
    if (committedBill) printBillViaRawBT(committedBill);
  };

  if (isPreviewLoading) {
    return (
      <div style={{ padding: 'var(--space-5)', textAlign: 'center', backgroundColor: 'var(--color-bg)', height: '100%' }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Loading read-only bill preview...</p>
      </div>
    );
  }

  const displayData = committedBill || previewData;
  const isPaid = committedBill?.paymentStatus === 'PAID';
  const invoiceTitle = committedBill
    ? (typeof committedBill.invoiceNumber === 'number'
        ? `Invoice #${committedBill.invoiceNumber} (${committedBill.financialYear || ''})`
        : (committedBill.invoiceNumber || `Bill #${committedBill.id.slice(-6).toUpperCase()}`))
    : 'Read-Only Bill Preview';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-bg)' }}>
      {/* 1. Header Bar */}
      <div style={{
        height: '60px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 var(--space-5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-card)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <Button variant="secondary" onClick={onBackToOrdering} style={{ fontSize: 'var(--text-xs)', padding: '6px 12px' }}>
            <ArrowLeft size={16} /> Return to Menu / Order Taking
          </Button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Receipt size={22} color="var(--color-brand)" />
            <h2 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-brand)' }}>
              {invoiceTitle}
            </h2>
            <span style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(107, 63, 42, 0.12)',
              color: 'var(--color-brand)'
            }}>
              {table.name} • {table.zone?.name || 'Zone'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Full-Page Billing Workspace Body */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: 'var(--space-4)',
        padding: 'var(--space-4)',
        overflowY: 'auto'
      }}>
        {/* LEFT COLUMN: Checkout Settlement & Customer CRM */}
        <div style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          boxShadow: 'var(--shadow-card)'
        }}>
          {/* Customer Details */}
          <div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: 'var(--text-base)', color: 'var(--color-brand)', fontWeight: 800 }}>
              Customer Details & CRM
            </h3>
            <CustomerResolveField
              selectedCustomer={displayData?.customer}
              onSelectCustomer={handleSelectCustomer}
              onClearCustomer={handleClearCustomer}
            />
          </div>

          {/* Checkout & Bill Generation Controls */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
            {actionError && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)', marginBottom: '8px' }}>{actionError}</div>}

            {!committedBill ? (
              /* PREVIEW MODE: Quick Checkout or Tab Override Button */
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--text-base)', color: 'var(--color-brand)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CreditCard size={18} /> Quick Checkout & Bill Generation
                </h3>

                {/* Tab / Split Payment Override Toggle */}
                <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={recordPaymentDifferently}
                      onChange={(e) => setRecordPaymentDifferently(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                    />
                    Record payment differently (Run Tab / Partial / Multi-Payment)
                  </label>
                </div>

                {!recordPaymentDifferently && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                      Select Quick Tender Method (Auto Mark Paid in Full)
                    </label>
                    <div className={styles.methodSelector} style={{ marginTop: '4px' }}>
                      {['CASH', 'UPI', 'CARD', 'OTHER'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          className={`${styles.methodBtn} ${quickPayMethod === m ? styles.activeMethod : ''}`}
                          onClick={() => setQuickPayMethod(m)}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explicit "Generate Bill" Commit Button */}
                <Button
                  onClick={() => handleCommitBillGeneration(false)}
                  disabled={isSubmitting}
                  fullWidth
                  style={{ minHeight: '44px', fontSize: 'var(--text-sm)' }}
                >
                  <Receipt size={18} /> {isSubmitting ? 'Generating & Committing...' : (recordPaymentDifferently ? 'Generate Bill (Unpaid / Tab)' : `Generate & Settle ₹${((displayData?.grandTotal || 0) / 100).toFixed(2)} (${quickPayMethod})`)}
                </Button>
              </div>
            ) : isPaid ? (
              /* COMMITTED MODE: Fully Paid Success Box */
              <div className={styles.paidSuccessBox}>
                <CheckCircle2 size={40} />
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 800 }}>Invoice Fully Paid & Settled</div>
                <p style={{ fontSize: 'var(--text-xs)', margin: '4px 0 12px 0' }}>Table workspace cleared to FREE.</p>
              </div>
            ) : (
              /* COMMITTED MODE: Multi-Payment Settlement Form */
              <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-brand)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CreditCard size={18} /> In-Place Payment Settlement
                </h3>

                <div>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                    Select Tender Method
                  </label>
                  <div className={styles.methodSelector} style={{ marginTop: '4px' }}>
                    {['CASH', 'UPI', 'CARD', 'OTHER'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        className={`${styles.methodBtn} ${paymentMethod === m ? styles.activeMethod : ''}`}
                        onClick={() => setPaymentMethod(m)}
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
                  label="Reference / Transaction Note (optional)"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. UPI Txn ID or Cash Note"
                />

                <Button type="submit" disabled={isSubmitting} fullWidth>
                  <Plus size={16} /> {isSubmitting ? 'Processing Payment...' : `Record ₹${payAmountRs || 0} ${paymentMethod} Payment`}
                </Button>
              </form>
            )}

            {/* Payments Log */}
            {committedBill?.payments?.length > 0 && (
              <div style={{ marginTop: 'var(--space-3)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Settlement Payments Log ({committedBill.payments.length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                  {committedBill.payments.map((p) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', padding: '6px 10px', backgroundColor: 'var(--color-bg)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
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

        {/* RIGHT COLUMN: Bill Preview Breakdown & Print Action */}
        <div style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <h3 style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-brand)', fontWeight: 800, borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            {committedBill ? 'Order & Service Itemization' : 'Read-Only Bill Preview Breakdown'}
          </h3>

          {/* Food & Drinks Lines */}
          {displayData?.orders?.length > 0 && (
            <div className={styles.lineSection}>
              <div className={styles.lineTitle}>
                <span>Food & Drinks Orders</span>
                <span>Subtotal: ₹{((displayData.foodTotal || 0) / 100).toFixed(2)}</span>
              </div>
              {displayData.orders.map((ord) => (
                <div key={ord.id}>
                  {ord.items.map((i) => (
                    <div key={i.id} className={styles.lineItem}>
                      <span>{i.quantity}x {i.menuItem?.name || 'Item'} (GST {i.gstPercentSnapshot ?? '5'}%)</span>
                      <span>₹{((i.priceSnapshot * i.quantity) / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Gaming Sessions Lines */}
          {displayData?.gamingSessions?.length > 0 && (
            <div className={styles.lineSection}>
              <div className={styles.lineTitle}>
                <span>Gaming Sessions</span>
                <span>Subtotal: ₹{((displayData.gamingTotal || 0) / 100).toFixed(2)}</span>
              </div>
              {displayData.gamingSessions.map((session) => (
                <div key={session.id} className={styles.lineItem}>
                  <span>Player: <strong>{session.playerLabel}</strong> (GST {session.gstPercentSnapshot ?? '18'}%)</span>
                  <span>Rate: ₹{session.halfHourRateSnapshot / 100}/30m</span>
                </div>
              ))}
            </div>
          )}

          {/* Tax & Discount Breakdown */}
          <div style={{ backgroundColor: 'var(--color-bg)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--text-xs)' }}>
            {displayData?.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-danger)', fontWeight: 700 }}>
                <span>Discount ({displayData.discountReason || 'Staff Discount'}):</span>
                <span>-₹{((displayData.discountAmount || 0) / 100).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
              <span>CGST:</span>
              <span>₹{((displayData?.cgstAmount || 0) / 100).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
              <span>SGST:</span>
              <span>₹{((displayData?.sgstAmount || 0) / 100).toFixed(2)}</span>
            </div>
          </div>

          {/* Grand Total Banner */}
          <div className={styles.totalBanner}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Grand Total
              </span>
              <span className={styles.grandTotal}>
                ₹{((displayData?.grandTotal || 0) / 100).toFixed(2)}
              </span>
            </div>
            {committedBill && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                <span>Total Paid: ₹{((committedBill.totalPaid || 0) / 100).toFixed(2)}</span>
                <span style={{ fontWeight: 700, color: isPaid ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  Balance Due: ₹{((committedBill.remainingBalance || 0) / 100).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Print Action */}
          {committedBill && (
            <Button
              variant="secondary"
              onClick={handleReprint}
              fullWidth
              style={{ marginTop: 'var(--space-2)' }}
            >
              <Printer size={16} /> Print Thermal Customer Receipt
            </Button>
          )}
        </div>
      </div>

      {/* Step 5: Kitchen Status Warning Modal */}
      {showKitchenModal && (
        <KitchenStatusWarningModal
          unfinishedOrders={unfinishedKitchenOrders}
          onCancel={() => setShowKitchenModal(false)}
          onConfirmOverride={() => handleCommitBillGeneration(true)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
