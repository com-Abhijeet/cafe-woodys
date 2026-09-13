import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Utensils, Receipt, Ban, Gamepad2 } from 'lucide-react';
import { voidOrderItemApi } from '../../orders/api/orders.api';
import styles from './TableWorkspaceModal.module.css';

function calculateSessionCharge(session) {
  const startTime = session.startTime ? new Date(session.startTime) : new Date();
  const endTime = session.endTime ? new Date(session.endTime) : (session.status === 'ACTIVE' ? new Date() : startTime);
  let elapsedMins = Math.max(1, Math.ceil((endTime - startTime) / (1000 * 60)));
  const graceMinutes = 5;
  const remainderInto30 = elapsedMins % 30;
  if (remainderInto30 > 0 && remainderInto30 <= graceMinutes) {
    elapsedMins -= remainderInto30;
  }
  const fullHours = Math.floor(elapsedMins / 60);
  const remainder = elapsedMins % 60;
  const hourly = session.hourlyRateSnapshot || 0;
  const halfHour = session.halfHourRateSnapshot || 0;
  let charge = fullHours * hourly;
  if (remainder > 0) {
    charge += remainder <= 30 ? halfHour : hourly;
  }
  if (session.maxChargeCap && session.maxChargeCap > 0) {
    charge = Math.min(charge, session.maxChargeCap);
  }
  return { elapsedMins, chargePaise: charge };
}

export function SubmittedOrdersList({ orders = [], gamingSessions = [], unbilledFoodTotal = 0, onRefreshOrders }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [voidingItemId, setVoidingItemId] = useState(null);
  const [voidReasonInput, setVoidReasonInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Estimate total gaming charges
  const unbilledGamingTotal = gamingSessions.reduce((sum, s) => {
    const { chargePaise } = calculateSessionCharge(s);
    return sum + chargePaise;
  }, 0);

  const combinedSubtotalPaise = unbilledFoodTotal + unbilledGamingTotal;
  const estTaxPaise = Math.round(combinedSubtotalPaise * 0.05);
  const estGrandTotalPaise = combinedSubtotalPaise + estTaxPaise;

  const handleVoidItemClick = (item) => {
    setVoidingItemId(item.id);
    setVoidReasonInput('');
    setErrorMsg('');
  };

  const handleConfirmVoid = async (itemId) => {
    if (!voidReasonInput || !voidReasonInput.trim()) {
      setErrorMsg('A reason is required to void an item.');
      return;
    }

    try {
      setErrorMsg('');
      await voidOrderItemApi(itemId, voidReasonInput.trim());
      setVoidingItemId(null);
      setVoidReasonInput('');
      if (onRefreshOrders) onRefreshOrders();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to void item.');
    }
  };

  const totalItemCount = orders.length + gamingSessions.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', backgroundColor: 'var(--color-surface)' }}>
      {/* 1. Header */}
      <button className={styles.pastOrdersHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Utensils size={16} color="var(--color-brand)" />
          <span style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--color-brand)' }}>
            Unbilled History ({totalItemCount})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 800, fontSize: 'var(--text-xs)', color: 'var(--color-brand)' }}>
            Subtotal: ₹{(combinedSubtotalPaise / 100).toFixed(2)}
          </span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '8px 12px 12px 12px' }}>
          {orders.length === 0 && gamingSessions.length === 0 ? (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '24px 0', flex: 1 }}>
              No orders or gaming sessions submitted yet for this visit.
            </div>
          ) : (
            <>
              {/* 2. Scrollable History Tickets Area */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                
                {/* Gaming Sessions Section Card */}
                {gamingSessions.length > 0 && (
                  <div style={{ backgroundColor: 'rgba(107, 63, 42, 0.05)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-brand)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-brand)', marginBottom: '6px', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Gamepad2 size={14} /> Gaming Sessions ({gamingSessions.length})
                      </span>
                      <span>Total: ₹{(unbilledGamingTotal / 100).toFixed(2)}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {gamingSessions.map((session) => {
                        const { elapsedMins, chargePaise } = calculateSessionCharge(session);
                        const isLive = session.status === 'ACTIVE';

                        return (
                          <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', backgroundColor: 'var(--color-surface)', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                {session.playerLabel || 'Player'}
                                {isLive && <span style={{ color: 'var(--color-success)', fontSize: '10px', marginLeft: '6px', fontWeight: 800 }}>(ACTIVE • {elapsedMins}m)</span>}
                                {!isLive && <span style={{ color: 'var(--color-text-secondary)', fontSize: '10px', marginLeft: '6px' }}>({elapsedMins}m closed)</span>}
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                Rates: ₹{(session.halfHourRateSnapshot / 100).toFixed(0)}/30m • ₹{(session.hourlyRateSnapshot / 100).toFixed(0)}/hr
                              </div>
                            </div>
                            <span style={{ fontWeight: 800, color: 'var(--color-brand)' }}>
                              ₹{(chargePaise / 100).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Food Orders Tickets */}
                {orders.map((ord, idx) => {
                  const activeItems = ord.items.filter((i) => !i.voidedAt);
                  const orderSubtotalPaise = activeItems.reduce((sum, i) => sum + (i.priceSnapshot * i.quantity), 0);
                  const orderNumber = orders.length - idx;
                  const isPending = ord.kitchenStatus === 'PENDING';

                  return (
                    <div key={ord.id} style={{ backgroundColor: 'var(--color-bg)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)', marginBottom: '6px' }}>
                        <span>Batch Food Order #{orderNumber}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)', fontSize: '10px' }}>
                          <Clock size={10} /> {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Dish Line Items */}
                      {ord.items.map((i) => {
                        const isVoided = Boolean(i.voidedAt);

                        return (
                          <div key={i.id} style={{ marginTop: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', opacity: isVoided ? 0.55 : 1 }}>
                              <span style={{ textDecoration: isVoided ? 'line-through' : 'none' }}>
                                <strong>{i.quantity}x</strong> {i.menuItem?.name || 'Item'}
                                {isVoided && <span style={{ color: 'var(--color-danger)', fontWeight: 700, marginLeft: '6px', fontSize: '10px' }}>[VOIDED]</span>}
                              </span>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ textDecoration: isVoided ? 'line-through' : 'none' }}>
                                  ₹{((i.priceSnapshot * i.quantity) / 100).toFixed(2)}
                                </span>

                                {!isVoided && isPending && (
                                  <button
                                    onClick={() => handleVoidItemClick(i)}
                                    title="Void item before kitchen starts cooking"
                                    style={{
                                      background: 'rgba(196, 57, 43, 0.1)',
                                      border: 'none',
                                      color: 'var(--color-danger)',
                                      borderRadius: '4px',
                                      padding: '2px 6px',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px'
                                    }}
                                  >
                                    <Ban size={10} /> Void
                                  </button>
                                )}
                              </div>
                            </div>

                            {isVoided && i.voidReason && (
                              <div style={{ fontSize: '10px', color: 'var(--color-danger)', fontStyle: 'italic', marginLeft: '12px', marginTop: '1px' }}>
                                Reason: {i.voidReason} {i.voidedByStaff ? `(by ${i.voidedByStaff.username})` : ''}
                              </div>
                            )}

                            {/* Line Void Reason Modal Input */}
                            {voidingItemId === i.id && (
                              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-danger)', borderRadius: '6px', padding: '8px', marginTop: '6px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-danger)', marginBottom: '4px' }}>
                                  Void Item: {i.menuItem?.name}
                                </div>
                                <input
                                  type="text"
                                  placeholder="Enter mandatory void reason (e.g. Ordered by mistake)"
                                  value={voidReasonInput}
                                  onChange={(e) => setVoidReasonInput(e.target.value)}
                                  style={{ width: '100%', padding: '6px', fontSize: '11px', border: '1px solid var(--color-border)', borderRadius: '4px', boxSizing: 'border-box' }}
                                />
                                {errorMsg && <div style={{ color: 'var(--color-danger)', fontSize: '10px', marginTop: '4px' }}>{errorMsg}</div>}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                                  <button
                                    onClick={() => setVoidingItemId(null)}
                                    style={{ background: 'none', border: '1px solid var(--color-border)', padding: '3px 8px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleConfirmVoid(i.id)}
                                    style={{ background: 'var(--color-danger)', color: '#fff', border: 'none', padding: '3px 8px', fontSize: '10px', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Confirm Void
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Individual Order Subtotal at bottom of order card */}
                      <div style={{ borderTop: '1px dashed var(--color-border)', marginTop: '6px', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)' }}>
                        <span>Order #{orderNumber} Subtotal:</span>
                        <span>₹{(orderSubtotalPaise / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 3. Pinned Cumulative Bill Preview Banner at Very Bottom */}
              <div style={{
                backgroundColor: 'rgba(107, 63, 42, 0.08)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--color-brand)',
                marginTop: '8px',
                flexShrink: 0,
                boxShadow: '0 -2px 6px rgba(0,0,0,0.04)'
              }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-brand)', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Receipt size={14} /> Cumulative Bill Preview
                  </span>
                  <span>{orders.length} Batch(es) • {gamingSessions.length} Gaming</span>
                </div>

                {unbilledFoodTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    <span>Food Subtotal:</span>
                    <span>₹{(unbilledFoodTotal / 100).toFixed(2)}</span>
                  </div>
                )}

                {unbilledGamingTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    <span>Gaming Subtotal:</span>
                    <span>₹{(unbilledGamingTotal / 100).toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  <span>Est. GST (5%):</span>
                  <span>₹{(estTaxPaise / 100).toFixed(2)}</span>
                </div>

                <div style={{ borderTop: '1px solid rgba(107, 63, 42, 0.3)', marginTop: '6px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-brand)' }}>
                  <span>Estimated Total Bill:</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800 }}>₹{(estGrandTotalPaise / 100).toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
