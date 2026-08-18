import { useState } from 'react';
import { useBilling } from '../hooks/useBilling';
import { CustomerResolveField } from '../../customers/components/CustomerResolveField';
import { printBillViaRawBT } from '../../../lib/rawbtPrinter';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { ArrowLeft, Printer, CheckCircle2, CreditCard, Plus, Receipt } from 'lucide-react';
import styles from './CheckoutModal.module.css';

export function WorkspaceBillingView({ bill: initialBill, table, onBackToOrdering, onRefreshTable }) {
  const { currentBill, submitPayment, attachCustomerToBill } = useBilling();
  const activeBill = currentBill || initialBill;

  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [payAmountRs, setPayAmountRs] = useState(
    activeBill ? (activeBill.remainingBalance / 100).toFixed(2) : ''
  );
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  if (!activeBill) return null;

  const isPaid = activeBill.paymentStatus === 'PAID';
  const invoiceTitle = typeof activeBill.invoiceNumber === 'number'
    ? `Invoice #${activeBill.invoiceNumber} (${activeBill.financialYear || ''})`
    : (activeBill.invoiceNumber || `Bill #${activeBill.id.slice(-6).toUpperCase()}`);

  const handleSelectCustomer = async (customer) => {
    try {
      await attachCustomerToBill(activeBill.id, customer.id);
      if (onRefreshTable) onRefreshTable();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleClearCustomer = async () => {
    try {
      await attachCustomerToBill(activeBill.id, null);
      if (onRefreshTable) onRefreshTable();
    } catch (err) {
      setActionError(err.message);
    }
  };

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
      const updated = await submitPayment(activeBill.id, {
        amount: amountPaise,
        method: paymentMethod,
        reference
      });
      setReference('');
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
    printBillViaRawBT(activeBill);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-bg)' }}>
      {/* 1. Ultra-Clean Workspace Header */}
      <div style={{
        height: '60px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 var(--space-5)',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
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

      {/* 2. Main Full-Page Billing Workspace Body (Left: Inputs & Payment | Right: Itemized Bill Summary & Print) */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: 'var(--space-4)',
        padding: 'var(--space-4)',
        overflowY: 'auto'
      }}>
        {/* LEFT COLUMN: Customer Details & Record Payment Settlement Inputs */}
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
          {/* Unified Customer Resolve Field */}
          <div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: 'var(--text-base)', color: 'var(--color-brand)', fontWeight: 800 }}>
              Customer Details & CRM
            </h3>
            <CustomerResolveField
              selectedCustomer={activeBill.customer}
              onSelectCustomer={handleSelectCustomer}
              onClearCustomer={handleClearCustomer}
            />
          </div>

          {/* Payment Settlement Form */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 'var(--text-base)', color: 'var(--color-brand)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={18} /> Record Payment Settlement
            </h3>

            {actionError && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)', marginBottom: '8px' }}>{actionError}</div>}

            {isPaid ? (
              <div className={styles.paidSuccessBox}>
                <CheckCircle2 size={40} />
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 800 }}>Invoice Fully Paid & Settled</div>
                <p style={{ fontSize: 'var(--text-xs)', margin: '4px 0 12px 0' }}>Table workspace status will clear to FREE upon completing exit.</p>
              </div>
            ) : (
              <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
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

            {/* Payment History Log */}
            {activeBill.payments?.length > 0 && (
              <div style={{ marginTop: 'var(--space-3)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Settlement Payments Log ({activeBill.payments.length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                  {activeBill.payments.map((p) => (
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

        {/* RIGHT COLUMN: Order & Service Itemization (The Bill Summary, Totals & Print Button) */}
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
            Order & Service Itemization
          </h3>

          {/* Food & Drinks Lines */}
          {activeBill.orders?.length > 0 && (
            <div className={styles.lineSection}>
              <div className={styles.lineTitle}>
                <span>Food & Drinks Orders</span>
                <span>Subtotal: ₹{(activeBill.foodTotal / 100).toFixed(2)}</span>
              </div>
              {activeBill.orders.map((ord) => (
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
          {activeBill.gamingSessions?.length > 0 && (
            <div className={styles.lineSection}>
              <div className={styles.lineTitle}>
                <span>Gaming Sessions</span>
                <span>Subtotal: ₹{(activeBill.gamingTotal / 100).toFixed(2)}</span>
              </div>
              {activeBill.gamingSessions.map((session) => (
                <div key={session.id} className={styles.lineItem}>
                  <span>Player: <strong>{session.playerLabel}</strong> (GST {session.gstPercentSnapshot ?? '18'}%)</span>
                  <span>Rate: ₹{session.halfHourRateSnapshot / 100}/30m</span>
                </div>
              ))}
            </div>
          )}

          {/* Tax & Discount Breakdown */}
          <div style={{ backgroundColor: 'var(--color-bg)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--text-xs)' }}>
            {activeBill.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-danger)', fontWeight: 700 }}>
                <span>Discount ({activeBill.discountReason || 'Staff Discount'}):</span>
                <span>-₹{(activeBill.discountAmount / 100).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
              <span>CGST:</span>
              <span>₹{((activeBill.cgstAmount || 0) / 100).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
              <span>SGST:</span>
              <span>₹{((activeBill.sgstAmount || 0) / 100).toFixed(2)}</span>
            </div>
          </div>

          {/* Grand Total Banner */}
          <div className={styles.totalBanner}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Grand Total
              </span>
              <span className={styles.grandTotal}>
                ₹{(activeBill.grandTotal / 100).toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              <span>Total Paid: ₹{(activeBill.totalPaid / 100).toFixed(2)}</span>
              <span style={{ fontWeight: 700, color: isPaid ? 'var(--color-success)' : 'var(--color-danger)' }}>
                Balance Due: ₹{(activeBill.remainingBalance / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action: Print Thermal Receipt at bottom of bill summary */}
          <Button
            variant="secondary"
            onClick={handleReprint}
            fullWidth
            style={{ marginTop: 'var(--space-2)' }}
          >
            <Printer size={16} /> Print Thermal Customer Receipt
          </Button>
        </div>
      </div>
    </div>
  );
}
