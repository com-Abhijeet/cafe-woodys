import { useState, useEffect } from 'react';
import { useBilling } from '../hooks/useBilling';
import { useCustomers } from '../../customers/hooks/useCustomers';
import { printBillViaRawBT } from '../../../lib/rawbtPrinter';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { X, CheckCircle2, Receipt, Printer, User, UserCheck, Plus, Search } from 'lucide-react';
import styles from './CheckoutModal.module.css';

export function CheckoutModal({ bill: initialBill, table, onClose, onRefreshTable }) {
  const { currentBill, submitPayment, attachCustomerToBill, loadBill } = useBilling();
  const activeBill = currentBill || initialBill;

  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [payAmountRs, setPayAmountRs] = useState('');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorAlert, setErrorAlert] = useState('');

  // Customer Capture states (Step 4)
  const [phoneSearch, setPhoneSearch] = useState('');
  const { customers, addCustomer, getCustomerProfile } = useCustomers(phoneSearch);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCustName, setNewCustName] = useState('');

  useEffect(() => {
    if (initialBill?.id) {
      loadBill(initialBill.id);
    }
  }, [initialBill?.id, loadBill]);

  useEffect(() => {
    if (activeBill) {
      const remainingRs = (activeBill.remainingBalance / 100).toFixed(2);
      setPayAmountRs(remainingRs);
      if (activeBill.customer) {
        setSelectedCustomer(activeBill.customer);
      }
    }
  }, [activeBill]);

  if (!activeBill) {
    return null;
  }

  const isPaid = activeBill.paymentStatus === 'PAID';

  const handleSelectCustomer = async (cust) => {
    try {
      await attachCustomerToBill(activeBill.id, cust.id);
      setSelectedCustomer(cust);
      setPhoneSearch('');
    } catch (err) {
      setErrorAlert(err.message);
    }
  };

  const handleCreateAndAttachCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName || !phoneSearch) return;
    try {
      const created = await addCustomer({ name: newCustName, phone: phoneSearch });
      await attachCustomerToBill(activeBill.id, created.id);
      setSelectedCustomer(created);
      setShowCreateForm(false);
      setNewCustName('');
      setPhoneSearch('');
    } catch (err) {
      setErrorAlert(err.message);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setErrorAlert('');

    const amountPaise = Math.round(parseFloat(payAmountRs) * 100);
    if (!amountPaise || amountPaise <= 0) {
      setErrorAlert('Please enter a valid payment amount');
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
        if (onRefreshTable) onRefreshTable();
      }
    } catch (err) {
      setErrorAlert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    printBillViaRawBT(activeBill);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt color="var(--color-brand)" size={22} />
            <h2 className={styles.title}>Bill Checkout — {table.name}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Button variant="secondary" onClick={handlePrint} style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}>
              <Printer size={14} /> Print Receipt
            </Button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Left Column: Bill Summary & Inline Customer Capture */}
          <div className={styles.billSummary}>
            {/* Step 4: Customer Capture Widget */}
            <div style={{ backgroundColor: 'var(--color-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-brand)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserCheck size={14} /> Customer Profile (Optional)
                </span>
                {selectedCustomer && (
                  <span style={{ fontSize: '10px', color: 'var(--color-success)', fontWeight: 800, backgroundColor: 'rgba(46, 125, 79, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                    Attached
                  </span>
                )}
              </div>

              {selectedCustomer ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-surface)', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)' }}>{selectedCustomer.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>📞 {selectedCustomer.phone}</div>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '10px', cursor: 'pointer', fontWeight: 700 }}>
                    Change
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ position: 'relative' }}>
                    <Input
                      placeholder="Type phone or customer name..."
                      value={phoneSearch}
                      onChange={(e) => { setPhoneSearch(e.target.value); setShowCreateForm(false); }}
                      style={{ fontSize: 'var(--text-xs)' }}
                    />
                  </div>

                  {/* Customer search results dropdown */}
                  {phoneSearch && (
                    <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                      {customers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          style={{ padding: '6px 8px', backgroundColor: 'var(--color-surface)', borderRadius: '4px', border: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}
                        >
                          <span><strong>{c.name}</strong> ({c.phone})</span>
                          <span style={{ color: 'var(--color-brand)', fontWeight: 700 }}>Select</span>
                        </div>
                      ))}

                      {customers.length === 0 && !showCreateForm && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px', fontSize: 'var(--text-xs)' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>No matching customer found.</span>
                          <Button variant="secondary" onClick={() => setShowCreateForm(true)} style={{ padding: '2px 8px', fontSize: '10px' }}>
                            <Plus size={10} /> Add New
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inline Create Form */}
                  {showCreateForm && (
                    <form onSubmit={handleCreateAndAttachCustomer} style={{ marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <Input
                        placeholder="Customer Name"
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        required
                        style={{ fontSize: 'var(--text-xs)', flex: 1 }}
                      />
                      <Button type="submit" style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}>
                        Save & Attach
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Food & Drinks Lines */}
            {activeBill.orders?.length > 0 && (
              <div className={styles.lineSection}>
                <div className={styles.lineTitle}>
                  <span>Food & Drinks</span>
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
                  Total Amount Due
                </span>
                <span className={styles.grandTotal}>
                  ₹{(activeBill.grandTotal / 100).toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                <span>Paid So Far: ₹{(activeBill.totalPaid / 100).toFixed(2)}</span>
                <span style={{ fontWeight: 700, color: isPaid ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  Balance: ₹{(activeBill.remainingBalance / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Split Tender Entry & Status */}
          <div className={styles.paymentPanel}>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-brand)' }}>
              Split Tender Payment
            </div>

            {errorAlert && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{errorAlert}</div>}

            {isPaid ? (
              <div className={styles.paidSuccessBox}>
                <CheckCircle2 size={36} />
                <div>Bill Fully Settled & Paid</div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 400 }}>
                  Table {table.name} has been cleared back to FREE state.
                </div>
                <Button onClick={handlePrint} style={{ marginTop: 'var(--space-2)' }}>
                  <Printer size={16} /> Print RawBT Receipt
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                    Payment Method
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
                  label="Amount (₹)"
                  type="number"
                  step="0.01"
                  value={payAmountRs}
                  onChange={(e) => setPayAmountRs(e.target.value)}
                  required
                />

                <Input
                  label="Reference / Txn Note (optional)"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. UPI Ref # or Cash Note"
                />

                <Button type="submit" disabled={isSubmitting} fullWidth>
                  {isSubmitting ? 'Recording...' : `Record ₹${payAmountRs || 0} ${paymentMethod}`}
                </Button>
              </form>
            )}

            {/* Payments History List */}
            {activeBill.payments?.length > 0 && (
              <div style={{ marginTop: 'var(--space-2)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Payments Recorded:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                  {activeBill.payments.map((p) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', padding: '4px 8px', backgroundColor: 'var(--color-surface)', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                      <span><strong>{p.method}</strong> {p.reference ? `(${p.reference})` : ''}</span>
                      <span style={{ fontWeight: 700 }}>₹{(p.amount / 100).toFixed(2)}</span>
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
