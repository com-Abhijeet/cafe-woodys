import { useState } from 'react';
import { useBilling } from '../hooks/useBilling';
import { printBillViaRawBT } from '../../../lib/rawbtPrinter';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { X, Receipt, Printer, CheckCircle2, Clock, Plus, CreditCard, User } from 'lucide-react';
import styles from './CheckoutModal.module.css';

export function BillDetailModal({ bill: initialBill, onClose, onRefresh }) {
  const { currentBill, submitPayment, loadBill } = useBilling();
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
      await submitPayment(activeBill.id, {
        amount: amountPaise,
        method: paymentMethod,
        reference
      });
      setReference('');
      if (onRefresh) onRefresh();
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
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt color="var(--color-brand)" size={22} />
            <div>
              <h2 className={styles.title}>Bill #{activeBill.id.slice(-6).toUpperCase()}</h2>
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                {activeBill.table?.name} • Created {new Date(activeBill.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Button variant="secondary" onClick={handleReprint} style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}>
              <Printer size={14} /> Reprint Receipt
            </Button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Left Column: Bill Breakdown */}
          <div className={styles.billSummary}>
            {/* Customer Details */}
            {activeBill.customer && (
              <div style={{ backgroundColor: 'var(--color-bg)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', marginBottom: '10px', fontSize: 'var(--text-xs)' }}>
                <span style={{ color: 'var(--color-brand)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={14} /> Billed Customer: {activeBill.customer.name} ({activeBill.customer.phone})
                </span>
              </div>
            )}

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
                        <span>{i.quantity}x {i.menuItem?.name || 'Item'}</span>
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
                    <span>Player: <strong>{session.playerLabel}</strong></span>
                    <span>Rate: ₹{session.halfHourRateSnapshot / 100}/30m</span>
                  </div>
                ))}
              </div>
            )}

            {/* Grand Total Banner */}
            <div className={styles.totalBanner}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Total Bill Amount
                </span>
                <span className={styles.grandTotal}>
                  ₹{(activeBill.grandTotal / 100).toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                <span>Total Paid: ₹{(activeBill.totalPaid / 100).toFixed(2)}</span>
                <span style={{ fontWeight: 700, color: isPaid ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  Balance Due: ₹{(activeBill.remainingBalance / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: In-Place Payment Marking */}
          <div className={styles.paymentPanel}>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-brand)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={18} /> In-Place Payment Settlement
            </div>

            {actionError && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{actionError}</div>}

            {isPaid ? (
              <div className={styles.paidSuccessBox}>
                <CheckCircle2 size={36} />
                <div>Bill Fully Paid & Settled</div>
                <Button onClick={handleReprint} style={{ marginTop: 'var(--space-2)' }}>
                  <Printer size={16} /> Reprint Thermal Receipt
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                    Select Payment Method
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
                  placeholder="e.g. UPI Ref # or Cash Note"
                />

                <Button type="submit" disabled={isSubmitting} fullWidth>
                  <Plus size={14} /> {isSubmitting ? 'Recording...' : `Add ₹${payAmountRs || 0} ${paymentMethod} Payment`}
                </Button>
              </form>
            )}

            {/* Payments History List */}
            {activeBill.payments?.length > 0 && (
              <div style={{ marginTop: 'var(--space-3)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Recorded Payments History ({activeBill.payments.length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                  {activeBill.payments.map((p) => (
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
