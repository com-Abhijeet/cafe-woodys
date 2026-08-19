import { useState } from 'react';
import { useBilling } from '../hooks/useBilling';
import { useAuth } from '../../../hooks/useAuth';
import { useBusinessProfile } from '../../settings/hooks/useBusinessProfile';
import { printBillViaRawBT } from '../../../lib/rawbtPrinter';
import { formatInvoiceNumber } from '../../../lib/invoiceFormat';
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
    ? formatInvoiceNumber(activeBill.invoiceNumber, activeBill.financialYear)
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

  const handleVoidBill = async (e) => {
    e.preventDefault();
    setActionError('');
    if (!voidReason.trim()) {
      setActionError('Please specify a reason for voiding this bill.');
      return;
    }

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

  const handlePrintReceipt = () => {
    printBillViaRawBT(activeBill, { businessProfile: profile });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ maxWidth: '800px' }}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <Receipt size={22} color="var(--color-primary)" />
            <div>
              <h3 className={styles.title}>{invoiceTitle}</h3>
              <p className={styles.subtitle}>
                {activeBill.table?.name || (activeBill.orderType === 'PARCEL' ? 'Parcel / Takeaway' : 'Table')} • {activeBill.table?.zone?.name || 'Zone'} • Issued {new Date(activeBill.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Button onClick={handlePrintReceipt} variant="secondary">
              <Printer size={16} /> Print Receipt
            </Button>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Voided Warning Banner */}
        {isVoided && (
          <div style={{ padding: '12px 16px', backgroundColor: 'rgba(196,57,43,0.15)', borderLeft: '4px solid var(--color-danger)', color: 'var(--color-danger)', fontWeight: 700, fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Ban size={18} />
            <div>
              THIS BILL HAS BEEN VOIDED ({new Date(activeBill.voidedAt).toLocaleDateString()}). Reason: "{activeBill.voidReason}"
            </div>
          </div>
        )}

        {/* Content Body Grid */}
        <div style={{ padding: 'var(--space-4)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)', maxHeight: '75vh', overflowY: 'auto' }}>
          
          {/* Left Column: Line Items & Pricing Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            
            {/* Customer Info Box */}
            <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={14} /> CUSTOMER DETAILS
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {activeBill.customer ? activeBill.customer.name : 'Walk-in Customer'}
              </div>
              {activeBill.customer?.phone && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Ph: {activeBill.customer.phone}
                </div>
              )}
            </div>

            {/* Food Line Items */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-bg-secondary)', fontWeight: 700, fontSize: 'var(--text-xs)', borderBottom: '1px solid var(--color-border)' }}>
                FOOD ORDERS
              </div>
              {activeBill.orders?.length === 0 ? (
                <div style={{ padding: '12px', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>No food orders</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', divideY: '1px solid var(--color-border)' }}>
                  {activeBill.orders?.flatMap((ord) => ord.items || []).map((item, idx) => (
                    <div key={idx} style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                      <span>{item.quantity}x {item.menuItem?.name || 'Item'}</span>
                      <span style={{ fontWeight: 600 }}>₹{((item.priceSnapshot * item.quantity) / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gaming Sessions */}
            {activeBill.gamingSessions?.length > 0 && (
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-bg-secondary)', fontWeight: 700, fontSize: 'var(--text-xs)', borderBottom: '1px solid var(--color-border)' }}>
                  GAMING SESSIONS
                </div>
                {activeBill.gamingSessions.map((session, idx) => (
                  <div key={idx} style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                    <span>Play: {session.playerLabel || 'Player'}</span>
                    <span style={{ fontWeight: 600 }}>₹{((session.hourlyRateSnapshot || 0) / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Financial Summary */}
            <div style={{ padding: '12px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Subtotal:</span>
                <span>₹{(((activeBill.foodTotal || 0) + (activeBill.gamingTotal || 0)) / 100).toFixed(2)}</span>
              </div>
              {activeBill.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)', marginBottom: '4px' }}>
                  <span>Discount ({activeBill.discountReason || 'Promo'}):</span>
                  <span>-₹{(activeBill.discountAmount / 100).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                <span>CGST + SGST:</span>
                <span>₹{(((activeBill.cgstAmount || 0) + (activeBill.sgstAmount || 0)) / 100).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', fontWeight: 800, marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                <span>GRAND TOTAL:</span>
                <span style={{ color: 'var(--color-brand)' }}>₹{(activeBill.grandTotal / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Status & Record Payment Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            
            {/* Balance Due Card */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: isPaid ? 'rgba(39,174,96,0.1)' : 'rgba(230,126,34,0.1)', border: `1px solid ${isPaid ? 'var(--color-success)' : 'var(--color-warning)'}` }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>PAYMENT STATUS</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: isPaid ? 'var(--color-success)' : 'var(--color-warning)', marginTop: '4px' }}>
                {isPaid ? 'PAID IN FULL' : `BALANCE DUE: ₹${(activeBill.remainingBalance / 100).toFixed(2)}`}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Total Paid So Far: ₹{((activeBill.totalPaid || 0) / 100).toFixed(2)}
              </div>
            </div>

            {/* UPI Dynamic QR Code */}
            {profile?.upiId && !isPaid && !isVoided && (
              <UpiQrCode
                upiId={profile.upiId}
                payeeName={profile.upiPayeeName || profile.businessName}
                amountPaise={activeBill.remainingBalance}
                note={invoiceTitle}
              />
            )}

            {/* Payments History List */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-bg-secondary)', fontWeight: 700, fontSize: 'var(--text-xs)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CreditCard size={14} /> PAYMENT TRANSACTION HISTORY
              </div>
              {activeBill.payments?.length === 0 ? (
                <div style={{ padding: '12px', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>No payments recorded yet</div>
              ) : (
                <div style={{ divideY: '1px solid var(--color-border)' }}>
                  {activeBill.payments?.map((p) => (
                    <div key={p.id} style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{p.method}</span>
                        {p.reference && <span style={{ color: 'var(--color-text-secondary)', marginLeft: '4px' }}>({p.reference})</span>}
                        <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{new Date(p.createdAt).toLocaleString()}</div>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>₹{(p.amount / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Record New Payment Form (Only if balance remains and not voided) */}
            {!isPaid && !isVoided && (
              <form onSubmit={handleRecordPayment} style={{ padding: '12px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)' }}>
                  RECORD SPLIT / PARTIAL PAYMENT
                </div>
                {actionError && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>{actionError}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <Input
                    label="Amount (₹)"
                    type="number"
                    step="0.01"
                    value={payAmountRs}
                    onChange={(e) => setPayAmountRs(e.target.value)}
                    required
                  />
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '4px' }}>Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', fontWeight: 600 }}
                    >
                      <option value="CASH">CASH</option>
                      <option value="UPI">UPI / QR</option>
                      <option value="CARD">CREDIT/DEBIT CARD</option>
                      <option value="NETBANKING">NETBANKING</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="Transaction Ref / Notes (Optional)"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. UPI Ref #987654"
                />

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Recording...' : 'Record Payment'}
                </Button>
              </form>
            )}

            {/* Void Bill Action (Admin Only) */}
            {isAdmin && !isVoided && (
              <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px dashed var(--color-border)' }}>
                {!showVoidModal ? (
                  <Button variant="danger" onClick={() => setShowVoidModal(true)} style={{ width: '100%' }}>
                    <AlertOctagon size={16} /> Void This Invoice (Admin Only)
                  </Button>
                ) : (
                  <form onSubmit={handleVoidBill} style={{ padding: '12px', backgroundColor: 'rgba(196,57,43,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-danger)', marginBottom: '8px' }}>
                      CONFIRM VOIDING INVOICE #{activeBill.invoiceNumber}
                    </div>
                    <Input
                      label="Mandatory Void Reason"
                      value={voidReason}
                      onChange={(e) => setVoidReason(e.target.value)}
                      placeholder="e.g. Customer cancelled order / Wrong billing"
                      required
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <Button type="submit" variant="danger" disabled={isSubmitting}>
                        Confirm Void
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => setShowVoidModal(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
