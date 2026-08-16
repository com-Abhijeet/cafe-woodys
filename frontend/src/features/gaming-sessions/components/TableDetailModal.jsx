import { useState } from 'react';
import { useGamingSession } from '../hooks/useGamingSession';
import { useMenu } from '../../menu/hooks/useMenu';
import { useOrders } from '../../orders/hooks/useOrders';
import { useBilling } from '../../billing/hooks/useBilling';
import { CheckoutModal } from '../../billing/components/CheckoutModal';
import { getTransformedImageUrl } from '../../../lib/cloudinary';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { Gamepad2, Plus, Clock, X, AlertCircle, Utensils, Receipt } from 'lucide-react';
import styles from './TableDetailModal.module.css';

export function TableDetailModal({ table, onClose, onRefreshTable }) {
  const isGaming = table.zone?.type === 'GAMING';
  const [activeTab, setActiveTab] = useState(isGaming ? 'GAMING' : 'ORDERS');

  // Hooks
  const {
    sessions,
    isLoading: isSessionsLoading,
    error: sessionsError,
    startSession,
    closeSession,
    getFormattedDuration,
    getEstimatedCharge
  } = useGamingSession(table.id);

  const { items: menuItems, isLoading: isMenuLoading } = useMenu();
  const { orders, unbilledFoodTotal, submitOrder } = useOrders(table.id);
  const { createBill, currentBill } = useBilling();

  // States
  const [playerLabel, setPlayerLabel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [activeCheckoutBill, setActiveCheckoutBill] = useState(null);

  const maxPlayers = table.effectiveMaxPlayers || 4;
  const activeCount = sessions.length;
  const isTableFull = activeCount >= maxPlayers;

  const hasUnbilledContent = orders.length > 0 || sessions.length > 0;

  // Gaming actions
  const handleStartSession = async (e) => {
    e.preventDefault();
    setActionError('');
    setIsSubmitting(true);
    try {
      await startSession(playerLabel);
      setPlayerLabel('');
      if (onRefreshTable) onRefreshTable();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSession = async (sessionId, name) => {
    if (!confirm(`End gaming session for ${name}?`)) return;
    setActionError('');
    try {
      const closed = await closeSession(sessionId);
      alert(`Session ended for ${name}.\nElapsed Time: ${closed.elapsedMinutes} mins\nCharge: ₹${(closed.calculatedCharge / 100).toFixed(2)}`);
      if (onRefreshTable) onRefreshTable();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Cart actions
  const addToCart = (menuItem) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((c) => c.menuItem.id === menuItem.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  };

  const updateCartQty = (menuItemId, delta) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.menuItem.id === menuItemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean);
    });
  };

  const handleOrderSubmit = async () => {
    if (cart.length === 0) return;
    setActionError('');
    setIsSubmitting(true);

    const itemsPayload = cart.map((c) => ({
      menuItemId: c.menuItem.id,
      quantity: c.quantity
    }));

    try {
      await submitOrder(itemsPayload);
      setCart([]);
      if (onRefreshTable) onRefreshTable();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Checkout trigger
  const handleGenerateCheckoutBill = async () => {
    setActionError('');
    setIsSubmitting(true);
    try {
      const bill = await createBill(table.id);
      setActiveCheckoutBill(bill);
      if (onRefreshTable) onRefreshTable();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = Array.from(new Set(menuItems.map((m) => m.category))).filter(Boolean);
  const filteredMenuItems = selectedCategory === 'ALL'
    ? menuItems.filter((m) => m.isAvailable)
    : menuItems.filter((m) => m.isAvailable && m.category === selectedCategory);

  const cartTotalPaise = cart.reduce((sum, c) => sum + (c.menuItem.price * c.quantity), 0);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h2 className={styles.tableName}>{table.name}</h2>
            <span style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isGaming ? 'rgba(59, 110, 201, 0.15)' : 'rgba(201, 122, 59, 0.15)',
              color: isGaming ? 'var(--color-gaming-zone)' : 'var(--color-cafe-zone)'
            }}>
              {table.zone?.name || (isGaming ? 'Gaming Zone' : 'Café Zone')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {hasUnbilledContent && (
              <Button onClick={handleGenerateCheckoutBill} disabled={isSubmitting}>
                <Receipt size={16} /> Checkout & Bill
              </Button>
            )}
            <button className={styles.closeButton} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabBar}>
          {isGaming && (
            <button
              className={`${styles.tabButton} ${activeTab === 'GAMING' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('GAMING')}
            >
              <Gamepad2 size={16} /> Seated Players ({activeCount})
            </button>
          )}
          <button
            className={`${styles.tabButton} ${activeTab === 'ORDERS' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('ORDERS')}
          >
            <Utensils size={16} /> Food & Drinks (₹{(unbilledFoodTotal / 100).toFixed(2)})
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {actionError && (
            <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)', backgroundColor: 'rgba(196,57,43,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
              {actionError}
            </div>
          )}

          {/* TAB 1: GAMING SESSIONS */}
          {activeTab === 'GAMING' && isGaming && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>
                  <Gamepad2 size={18} color="var(--color-gaming-zone)" />
                  Active Seated Players ({activeCount} / {maxPlayers} Capacity)
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  Rates: ₹{(table.effectiveHalfHourRate || 0) / 100}/30m • ₹{(table.effectiveHourlyRate || 0) / 100}/hr
                </span>
              </div>

              {!isTableFull ? (
                <form onSubmit={handleStartSession} className={styles.addPlayerBar}>
                  <Input
                    placeholder={`e.g. Player ${activeCount + 1}`}
                    value={playerLabel}
                    onChange={(e) => setPlayerLabel(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Button type="submit" disabled={isSubmitting}>
                    <Plus size={16} /> Add Player
                  </Button>
                </form>
              ) : (
                <div className={styles.capacityWarning}>
                  <AlertCircle size={16} />
                  Station capacity reached ({maxPlayers}/{maxPlayers} players seated). End a session to seat a new player.
                </div>
              )}

              {isSessionsLoading ? (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loading active player sessions...</p>
              ) : sessionsError ? (
                <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{sessionsError}</p>
              ) : sessions.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--color-bg)', borderRadius: '8px', border: '1px dashed var(--color-border)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  No active gaming sessions running on this table. Click "Add Player" above to start time tracking.
                </div>
              ) : (
                <div className={styles.playerGrid}>
                  {sessions.map((session) => {
                    const estCharge = getEstimatedCharge(session);
                    return (
                      <div key={session.id} className={styles.playerCard}>
                        <div className={styles.playerHeader}>
                          <span className={styles.playerName}>{session.playerLabel}</span>
                          <span className={styles.timerBadge}>
                            <Clock size={12} />
                            {getFormattedDuration(session.startTime)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <span className={styles.chargeBadge}>
                            Est. ₹{(estCharge / 100).toFixed(2)}
                          </span>
                          <Button
                            variant="danger"
                            onClick={() => handleCloseSession(session.id, session.playerLabel)}
                            style={{ minHeight: '36px', padding: '4px 12px', fontSize: 'var(--text-xs)' }}
                          >
                            End Session
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FOOD & DRINKS ORDERING */}
          {activeTab === 'ORDERS' && (
            <div className={styles.orderLayout}>
              <div className={styles.menuPanel}>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                  <button
                    className={`${styles.tabButton} ${selectedCategory === 'ALL' ? styles.activeTab : ''}`}
                    onClick={() => setSelectedCategory('ALL')}
                    style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}
                  >
                    All Items
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      className={`${styles.tabButton} ${selectedCategory === cat ? styles.activeTab : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                      style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {isMenuLoading ? (
                  <p>Loading menu items...</p>
                ) : (
                  <div className={styles.menuGrid}>
                    {filteredMenuItems.map((item) => {
                      const imgUrl = getTransformedImageUrl(item.imageUrl, 200, 200);
                      return (
                        <div key={item.id} className={styles.menuCard} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {imgUrl ? (
                              <img src={imgUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Utensils size={18} color="var(--color-text-secondary)" />
                            )}
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{item.name}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-brand)', fontWeight: 700 }}>
                              ₹{(item.price / 100).toFixed(2)}
                            </div>
                          </div>

                          <Button
                            variant="secondary"
                            onClick={() => addToCart(item)}
                            style={{ minHeight: '36px', padding: '4px 8px', fontSize: 'var(--text-xs)' }}
                          >
                            + Add
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className={styles.cartPanel}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>New Order Cart</span>
                    <span>₹{(cartTotalPaise / 100).toFixed(2)}</span>
                  </div>

                  {cart.length === 0 ? (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '16px' }}>
                      Cart is empty. Tap menu items to build an order.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                      {cart.map((c) => (
                        <div key={c.menuItem.id} className={styles.cartItem}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{c.menuItem.name}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                              ₹{(c.menuItem.price / 100).toFixed(2)} each
                            </div>
                          </div>
                          <div className={styles.qtyStepper}>
                            <button className={styles.qtyBtn} onClick={() => updateCartQty(c.menuItem.id, -1)}>-</button>
                            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>{c.quantity}</span>
                            <button className={styles.qtyBtn} onClick={() => updateCartQty(c.menuItem.id, 1)}>+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    onClick={handleOrderSubmit}
                    disabled={cart.length === 0 || isSubmitting}
                    fullWidth
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Order to Table'}
                  </Button>
                </div>

                <div className={styles.unbilledOrdersBox}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', color: 'var(--color-brand)' }}>
                    <span>Unbilled Orders History</span>
                    <span>Total: ₹{(unbilledFoodTotal / 100).toFixed(2)}</span>
                  </div>

                  {orders.length === 0 ? (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      No unbilled food/drink orders placed for this table yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                      {orders.map((ord, idx) => (
                        <div key={ord.id} style={{ backgroundColor: 'var(--color-surface)', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                            <span>Order #{orders.length - idx}</span>
                            <span>{new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {ord.items.map((i) => (
                            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                              <span>{i.quantity}x {i.menuItem?.name || 'Item'}</span>
                              <span>₹{((i.priceSnapshot * i.quantity) / 100).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Checkout Modal Overlay */}
        {activeCheckoutBill && (
          <CheckoutModal
            bill={activeCheckoutBill}
            table={table}
            onClose={() => setActiveCheckoutBill(null)}
            onRefreshTable={onRefreshTable}
          />
        )}
      </div>
    </div>
  );
}
