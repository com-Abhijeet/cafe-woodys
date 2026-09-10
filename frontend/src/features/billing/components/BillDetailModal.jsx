import { useState } from 'react';
import { useBilling } from '../hooks/useBilling';
import { useAuth } from '../../../hooks/useAuth';
import { useBusinessProfile } from '../../settings/hooks/useBusinessProfile';
import { printReceipt } from '../../../lib/print/PrintService';
import { formatInvoiceNumber } from '../../../lib/invoiceFormat';
import { recordRefundApi, fetchBillApi } from '../api/billing.api';
import { UpiQrCode } from './UpiQrCode';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { X, Receipt, Printer, CreditCard, User, AlertOctagon, Ban, ArrowRightLeft, RefreshCw, RotateCcw } from 'lucide-react';
import styles from './CheckoutModal.module.css';

export function BillDetailModal({ bill: initialBill, onClose, onRefresh }) {
  const { user } = useAuth();
  const { currentBill, submitPayment, voidBill } = useBilling();
  const { profile } = useBusinessProfile();
  const [inspectedBill, setInspectedBill] = useState(null);
  const activeBill = inspectedBill || currentBill || initialBill;

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

  // Refund State
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundAmountRs, setRefundAmountRs] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('CASH');

  if (!activeBill) return null;

  const role = user?.role || 'WAITER';
  const isAdmin = role === 'ADMIN';
  const isVoided = !!activeBill.voidedAt;
  const isPaid = activeBill.paymentStatus === 'PAID';
  const isPaidOrPartial = activeBill.paymentStatus === 'PAID' || activeBill.paymentStatus === 'PARTIALLY_PAID';

  // Step 4 Permission Matrix: Unpaid = COUNTER / ADMIN, Paid = ADMIN ONLY
  const canVoidBill = !isVoided && (isPaidOrPartial ? role === 'ADMIN' : (role === 'COUNTER' || role === 'ADMIN'));

  const invoiceTitle = typeof activeBill.invoiceNumber === 'number'
    ? formatInvoiceNumber(activeBill.invoiceNumber, activeBill.financialYear)
    : (activeBill.invoiceNumber || `Bill #${activeBill.id.slice(-6).toUpperCase()}`);

  const handleSwitchBill = async (billId) => {
    try {
      setIsSubmitting(true);
      const targetBill = await fetchBillApi(billId);
      setInspectedBill(targetBill);
    } catch (err) {
      setActionError('Failed to load linked bill details');
    } finally {
      setIsSubmitting(false);
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

  const handleRecordRefund = async (e) => {
    e.preventDefault();
    setActionError('');

    const refundPaise = Math.round(parseFloat(refundAmountRs) * 100);
    if (!refundPaise || refundPaise <= 0) {
      setActionError('Please enter a valid refund amount');
      return;
    }

    if (!refundReason.trim()) {
      setActionError('A reason is mandatory when recording a refund.');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordRefundApi(activeBill.id, {
        amount: refundPaise,
        reason: refundReason.trim(),
        method: refundMethod
      });
      setShowRefundForm(false);
      setRefundAmountRs('');
      setRefundReason('');
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = async () => {
    await printReceipt(activeBill, { businessProfile: profile });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ maxWidth: '820px' }}>
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

        {/* Correction Lineage Badges & Links */}
        {(activeBill.correctionOfBill || activeBill.correctedByBill) && (
          <div style={{ padding: '8px 16px', backgroundColor: 'rgba(59, 110, 201, 0.1)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '12px', alignItems: 'center', fontSize: '11px' }}>
            <ArrowRightLeft size={14} color="var(--color-info)" />
            <span style={{ fontWeight: 700, color: 'var(--color-info)' }}>Bill Correction Audit Lineage:</span>

            {activeBill.correctionOfBill && (
              <button
                onClick={() => handleSwitchBill(activeBill.correctionOfBill.id)}
                style={{ background: 'none', border: '1px solid var(--color-info)', color: 'var(--color-info)', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontWeight: 700 }}
              >
                Correction of Inv #{formatInvoiceNumber(activeBill.correctionOfBill.invoiceNumber, activeBill.correctionOfBill.financialYear)}
              </button>
            )}

            {activeBill.correctedByBill && (
              <button
                onClick={() => handleSwitchBill(activeBill.correctedByBill.id)}
                style={{ background: 'none', border: '1px solid var(--color-success)', color: 'var(--color-success)', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontWeight: 700 }}
              >
                Replaced by Inv #{formatInvoiceNumber(activeBill.correctedByBill.invoiceNumber, activeBill.correctedByBill.financialYear)}
              </button>
            )}
          </div>
        )}

        {/* Voided Warning Banner */}
        {isVoided && (
          <div style={{ padding: '12px 16px', backgroundColor: 'rgba(196,57,43,0.15)', borderLeft: '4px solid var(--color-danger)', color: 'var(--color-danger)', fontWeight: 700, fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Ban size={18} />
            <div>
              THIS BILL HAS BEEN VOIDED ({new Date(activeBill.voidedAt).toLocaleDateString()} by {activeBill.voidedByStaff?.username || 'Staff'}). Reason: "{activeBill.voidReason}"
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
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {activeBill.orders?.flatMap((ord) => ord.items || []).map((item, idx) => {
                    const itemVoided = Boolean(item.voidedAt);
                    return (
                      <div key={idx} style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', borderBottom: '1px solid var(--color-border)', opacity: itemVoided ? 0.55 : 1 }}>
                        <span style={{ textDecoration: itemVoided ? 'line-through' : 'none' }}>
                          {item.quantity}x {item.menuItem?.name || 'Item'}
                          {itemVoided && <span style={{ color: 'var(--color-danger)', fontWeight: 700, marginLeft: '4px', fontSize: '10px' }}>[VOIDED]</span>}
                        </span>
                        <span style={{ fontWeight: 600, textDecoration: itemVoided ? 'line-through' : 'none' }}>
                          ₹{((item.priceSnapshot * item.quantity) / 100).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
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

          {/* Right Column: Payment Status, Refunds & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            
            {/* Balance Due Card */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: isPaid ? 'rgba(39,174,96,0.1)' : 'rgba(230,126,34,0.1)', border: `1px solid ${isPaid ? 'var(--color-success)' : 'var(--color-warning)'}` }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>PAYMENT STATUS</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: isPaid ? 'var(--color-success)' : 'var(--color-warning)', marginTop: '4px' }}>
                {isPaid ? 'PAID IN FULL' : `BALANCE DUE: ₹${(activeBill.remainingBalance / 100).toFixed(2)}`}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Total Paid: ₹{((activeBill.totalPaid || 0) / 100).toFixed(2)} {activeBill.totalRefunded > 0 ? `| Refunded: ₹${(activeBill.totalRefunded / 100).toFixed(2)}` : ''}
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

            {/* Refunds History List (Step 5 Audit Trail) */}
            {activeBill.refunds?.length > 0 && (
              <div style={{ border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', backgroundColor: 'rgba(196,57,43,0.1)', fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--color-danger)', borderBottom: '1px solid var(--color-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RotateCcw size={14} /> REFUNDS PROCESSED AUDIT
                </div>
                <div style={{ divideY: '1px solid var(--color-border)' }}>
                  {activeBill.refunds.map((r) => (
                    <div key={r.id} style={{ padding: '8px 12px', fontSize: 'var(--text-xs)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--color-danger)' }}>
                        <span>Method: {r.method}</span>
                        <span>-₹{(r.amount / 100).toFixed(2)}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        Reason: "{r.reason}" • Processed by {r.staff?.username || 'Admin'} on {new Date(r.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Record Refund Action (Admin Only on Voided Bills with Payments) */}
            {isAdmin && isVoided && (activeBill.totalPaid > 0) && (
              <div style={{ padding: '12px', backgroundColor: 'rgba(196,57,43,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)' }}>
                {!showRefundForm ? (
                  <Button variant="danger" onClick={() => setShowRefundForm(true)} style={{ width: '100%' }}>
                    <RotateCcw size={16} /> Record Customer Cash/UPI Refund (Admin Only)
                  </Button>
                ) : (
                  <form onSubmit={handleRecordRefund} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-danger)' }}>
                      RECORD REFUND FOR VOIDED INVOICE
                    </div>
                    {actionError && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>{actionError}</div>}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <Input
                        label="Refund Amount (₹)"
                        type="number"
                        step="0.01"
                        value={refundAmountRs}
                        onChange={(e) => setRefundAmountRs(e.target.value)}
                        placeholder={(activeBill.totalPaid / 100).toFixed(2)}
                        required
                      />
                      <div>
                        <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '4px' }}>Method</label>
                        <select
                          value={refundMethod}
                          onChange={(e) => setRefundMethod(e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', fontWeight: 600 }}
                        >
                          <option value="CASH">CASH</option>
                          <option value="UPI">UPI</option>
                          <option value="CARD">CARD</option>
                        </select>
                      </div>
                    </div>

                    <Input
                      label="Mandatory Refund Reason"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="e.g. Overcollected amount refunded after order correction"
                      required
                    />

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button type="submit" variant="danger" disabled={isSubmitting}>
                        {isSubmitting ? 'Recording...' : 'Confirm Refund'}
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => setShowRefundForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

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
                      <option value="OTHER">OTHER</option>
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

            {/* Void Bill Action (Step 4 Permission Matrix) */}
            {canVoidBill && (
              <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px dashed var(--color-border)' }}>
                {!showVoidModal ? (
                  <Button variant="danger" onClick={() => setShowVoidModal(true)} style={{ width: '100%' }}>
                    <AlertOctagon size={16} /> Void & Reissue Invoice ({isPaidOrPartial ? 'Admin Only' : 'Counter / Admin'})
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
                      placeholder="e.g. Items mistaken / Customer requested correction"
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
