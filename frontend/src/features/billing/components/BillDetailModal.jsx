import { useState } from 'react';
import { useBilling } from '../hooks/useBilling';
import { useAuth } from '../../../hooks/useAuth';
import { useBusinessProfile } from '../../settings/hooks/useBusinessProfile';
import { printBillViaRawBT } from '../../../lib/rawbtPrinter';
import { UpiQrCode } from './UpiQrCode';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { X, Receipt, Printer, CheckCircle2, Clock, Plus, CreditCard, User, AlertOctagon, Ban } from 'lucide-react';
import styles from './CheckoutModal.module.css';

export function BillDetailModal({ bill: initialBill, onClose, onRefresh }) {
  const { user } = useAuth();
  const { currentBill, submitPayment, voidBill } = useBilling();
  const { profile } = useBusinessProfile();
  const activeBill = currentBill || initialBill;

  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [payAmountRs, setPayAmountRs] = useState(
    activeBill ? (activeBill.remainingBalance / 100).toFixed(2) : ''
  );
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  // Voiding State
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');

  if (!activeBill) return null;

  const isAdmin = user?.role === 'ADMIN';
  const isVoided = !!activeBill.voidedAt;
  const isPaid = activeBill.paymentStatus === 'PAID';
  const invoiceTitle = typeof activeBill.invoiceNumber === 'number'
    ? `Invoice #${activeBill.invoiceNumber} (${activeBill.financialYear || ''})`
    : (activeBill.invoiceNumber || `Bill #${activeBill.id.slice(-6).toUpperCase()}`);

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

  const handleConfirmVoid = async (e) => {
    e.preventDefault();
    if (!voidReason.trim()) {
      setActionError('Reason is mandatory when voiding an issued bill');
      return;
    }
    setActionError('');
    setIsSubmitting(true);
    try {
      await voidBill(activeBill.id, voidReason);
      setShowVoidModal(false);
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
            <Receipt color={isVoided ? 'var(--color-danger)' : 'var(--color-brand)'} size={22} />
            <div>
              <h2 className={styles.title} style={{ color: isVoided ? 'var(--color-danger)' : 'inherit' }}>
                {invoiceTitle} {isVoided && '(VOIDED)'}
              </h2>
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                {activeBill.table?.name} • Created {new Date(activeBill.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {isAdmin && !isVoided && (
              <Button variant="danger" onClick={() => { setActionError(''); setShowVoidModal(true); }} style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}>
                <Ban size={14} /> Void Bill
              </Button>
            )}
            <Button variant="secondary" onClick={handleReprint} style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}>
              <Printer size={14} /> Print Invoice
            </Button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Voided Alert Banner if Voided */}
        {isVoided && (
          <div style={{ backgroundColor: 'rgba(196,57,43,0.12)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '10px 16px', margin: '12px 16px 0 16px', borderRadius: '6px', fontSize: 'var(--text-xs)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertOctagon size={18} />
            <div>
              <div>THIS INVOICE WAS VOIDED ON {new Date(activeBill.voidedAt).toLocaleString()}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>Reason: {activeBill.voidReason || 'None provided'}</div>
            </div>
          </div>
        )}

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

            {/* GST Tax & Discount Breakdown */}
            <div style={{ backgroundColor: 'var(--color-bg)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', margin: '10px 0', fontSize: 'var(--text-xs)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {activeBill.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-danger)', fontWeight: 700 }}>
                  <span>Discount ({activeBill.discountReason || 'Manual'}):</span>
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
            <div className={styles.totalBanner} style={{ opacity: isVoided ? 0.6 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Grand Total
                </span>
                <span className={styles.grandTotal}>
                  ₹{(activeBill.grandTotal / 100).toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                <span>Total Paid: ₹{(activeBill.totalPaid / 100).toFixed(2)}</span>
                <span style={{ fontWeight: 700, color: isVoided ? 'var(--color-danger)' : (isPaid ? 'var(--color-success)' : 'var(--color-danger)') }}>
                  {isVoided ? 'VOIDED' : `Balance Due: ₹${(activeBill.remainingBalance / 100).toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: In-Place Payment Marking & Dynamic UPI QR Code */}
          <div className={styles.paymentPanel}>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-brand)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={18} /> In-Place Payment Settlement
            </div>

            {/* Phase 16 Step 5: On-Screen Dynamic Amount-Embedded UPI QR Code */}
            {!isVoided && !isPaid && profile?.upiId && (
              <UpiQrCode
                upiId={profile.upiId}
                upiPayeeName={profile.upiPayeeName || profile.businessName}
                amountPaise={activeBill.remainingBalance || activeBill.grandTotal}
                note={invoiceTitle}
              />
            )}

            {actionError && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{actionError}</div>}

            {isVoided ? (
              <div className={styles.paidSuccessBox} style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
                <Ban size={36} />
                <div>This bill has been voided. No further payments can be added.</div>
              </div>
            ) : isPaid ? (
              <div className={styles.paidSuccessBox}>
                <CheckCircle2 size={36} />
                <div>Bill Fully Paid & Settled</div>
                <Button onClick={handleReprint} style={{ marginTop: 'var(--space-2)' }}>
                  <Printer size={16} /> Reprint Thermal Invoice
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

        {/* Modal: Void Reason Dialog */}
        {showVoidModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200
          }}>
            <form onSubmit={handleConfirmVoid} style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              maxWidth: '420px',
              width: '90%',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <h3 style={{ margin: 0, color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Ban size={20} /> Void Bill {invoiceTitle}
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Voiding a bill preserves its invoice number for financial auditing while invalidating its total. A mandatory reason is required.
              </p>

              <div style={{ margin: '16px 0' }}>
                <Input
                  label="Mandatory Void Reason"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="e.g. Order cancelled by customer / Duplicate bill entry"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <Button type="button" variant="secondary" onClick={() => setShowVoidModal(false)}>Cancel</Button>
                <Button type="submit" variant="danger" disabled={isSubmitting}>
                  {isSubmitting ? 'Voiding...' : 'Confirm Void Invoice'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
