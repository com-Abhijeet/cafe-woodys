import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { useBackHandler } from '../../../lib/native/backHandler';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { ArrowLeft, Ban, RefreshCw, Plus, Edit3, CheckCircle2, AlertCircle, ShoppingBag, Utensils } from 'lucide-react';
import styles from './CheckoutModal.module.css';

export function EditOrderScreen({ billId, onBack, onDone }) {
  useBackHandler(onBack);
  const [contextData, setContextData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Modals State
  const [voidingItem, setVoidingItem] = useState(null);
  const [voidReason, setVoidReason] = useState('');

  const [replaceItem, setReplaceItem] = useState(null);
  const [replaceReason, setReplaceReason] = useState('');
  const [replaceQty, setReplaceQty] = useState(1);
  const [replacePriceRs, setReplacePriceRs] = useState('');

  const [addingToOrderId, setAddingToOrderId] = useState(null);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [addQty, setAddQty] = useState(1);
  const [addPriceRs, setAddPriceRs] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEditContext = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/bills/${billId}/edit-context`);
      setContextData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load bill edit context');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (billId) loadEditContext();
  }, [billId]);

  // Action 1: Void Item (Allowed regardless of kitchen status in correction mode)
  const handleConfirmVoid = async () => {
    if (!voidReason.trim()) {
      setError('A mandatory reason is required to void an item');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await apiClient(`/order-items/${voidingItem.id}/void`, {
        method: 'PATCH',
        body: { reason: voidReason.trim(), ignoreKitchenStatus: true }
      });
      setVoidingItem(null);
      setVoidReason('');
      setActionSuccess('Item voided successfully!');
      loadEditContext();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to void item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action 2: Void and Replace Item (Quantity / Rate Correction)
  const handleConfirmVoidAndReplace = async () => {
    if (!replaceReason.trim()) {
      setError('A mandatory reason is required to void and replace an item');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const priceOverridePaise = replacePriceRs !== '' ? Math.round(parseFloat(replacePriceRs) * 100) : null;
      await apiClient(`/order-items/${replaceItem.id}/void-and-replace`, {
        method: 'POST',
        body: {
          reason: replaceReason.trim(),
          replacement: {
            menuItemId: replaceItem.menuItemId,
            quantity: parseInt(replaceQty, 10) || 1,
            priceOverride: priceOverridePaise
          }
        }
      });
      setReplaceItem(null);
      setReplaceReason('');
      setActionSuccess('Item replaced and corrected!');
      loadEditContext();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to replace item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action 3: Add New Item to Order
  const handleConfirmAddItem = async () => {
    if (!selectedMenuItemId) {
      setError('Please select a menu item to add');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const priceOverridePaise = addPriceRs !== '' ? Math.round(parseFloat(addPriceRs) * 100) : null;
      await apiClient(`/orders/${addingToOrderId}/items`, {
        method: 'POST',
        body: {
          menuItemId: selectedMenuItemId,
          quantity: parseInt(addQty, 10) || 1,
          priceOverride: priceOverridePaise
        }
      });
      setAddingToOrderId(null);
      setSelectedMenuItemId('');
      setActionSuccess('New item added to order!');
      loadEditContext();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add item to order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: 'var(--space-5)', textAlign: 'center', backgroundColor: 'var(--color-bg)', height: '100%' }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Loading bill correction edit context...</p>
      </div>
    );
  }

  const bill = contextData?.bill;
  const orders = contextData?.orders || [];
  const menuItems = contextData?.menuItems || [];

  // Compute live active totals across all linked orders
  let newFoodTotalPaise = 0;
  orders.forEach((ord) => {
    (ord.items || []).filter((i) => !i.voidedAt).forEach((i) => {
      newFoodTotalPaise += (i.priceSnapshot * i.quantity);
    });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-bg)' }}>
      {/* Header */}
      <div style={{
        height: '60px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 var(--space-4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-card)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Button variant="secondary" onClick={onBack} style={{ fontSize: 'var(--text-xs)', padding: '6px 12px' }}>
            <ArrowLeft size={16} /> Return to Billing
          </Button>

          <div>
            <h2 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-brand)' }}>
              Edit Order Screen — Bill Correction Context
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              Correcting Invoice #{bill?.invoiceNumber || bill?.id?.slice(-6)} ({bill?.table?.name || 'Takeaway'})
            </span>
          </div>
        </div>

        <Button onClick={onDone} style={{ fontSize: 'var(--text-xs)', fontWeight: 800, padding: '8px 16px' }}>
          <CheckCircle2 size={16} /> Proceed to Issue Corrected Bill (₹{(newFoodTotalPaise / 100).toFixed(2)})
        </Button>
      </div>

      {/* Main Body Grid */}
      <div style={{ flex: 1, padding: 'var(--space-4)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {error && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)', padding: '10px 14px', backgroundColor: 'rgba(196,57,43,0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={16} /> {error}</div>}
        {actionSuccess && <div style={{ color: 'var(--color-success)', fontSize: 'var(--text-xs)', padding: '10px 14px', backgroundColor: 'rgba(39,174,96,0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /> {actionSuccess}</div>}

        {/* Orders & Line Items Edit Container */}
        {orders.length === 0 ? (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>No orders found tied to this bill.</p>
        ) : (
          orders.map((ord, idx) => (
            <div key={ord.id} style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Utensils size={18} color="var(--color-brand)" />
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-brand)' }}>
                    Batch Order #{ord.dailyOrderNumber || ord.id.slice(-4)} ({ord.orderType})
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    • Kitchen Status: <strong>{ord.kitchenStatus}</strong> (Voiding unlocked for correction)
                  </span>
                </div>

                <Button variant="secondary" onClick={() => setAddingToOrderId(ord.id)} style={{ fontSize: '11px', padding: '4px 10px' }}>
                  <Plus size={14} /> Add Item to Order
                </Button>
              </div>

              {/* Line Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ord.items?.map((i) => {
                  const isVoided = Boolean(i.voidedAt);
                  return (
                    <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: isVoided ? 'rgba(196,57,43,0.06)' : 'var(--color-bg)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                      <div>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textDecoration: isVoided ? 'line-through' : 'none', color: isVoided ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>
                          {i.quantity}x {i.menuItem?.name} @ ₹{(i.priceSnapshot / 100).toFixed(2)}
                        </span>
                        {isVoided && (
                          <div style={{ fontSize: '10px', color: 'var(--color-danger)', fontStyle: 'italic', marginTop: '2px' }}>
                            VOIDED: {i.voidReason} {i.voidedByStaff ? `(by ${i.voidedByStaff.username})` : ''}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, textDecoration: isVoided ? 'line-through' : 'none' }}>
                          ₹{((i.priceSnapshot * i.quantity) / 100).toFixed(2)}
                        </span>

                        {!isVoided && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setReplaceItem(i);
                                setReplaceReason('');
                                setReplaceQty(i.quantity);
                                setReplacePriceRs((i.priceSnapshot / 100).toString());
                              }}
                              style={{ background: 'rgba(59,130,246,0.1)', border: 'none', color: '#3b82f6', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Edit3 size={12} /> Replace / Fix Rate
                            </button>

                            <button
                              onClick={() => {
                                setVoidingItem(i);
                                setVoidReason('');
                              }}
                              style={{ background: 'rgba(196,57,43,0.1)', border: 'none', color: 'var(--color-danger)', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Ban size={12} /> Void Item
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal 1: Void Item Modal */}
      {voidingItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '90%', maxWidth: '400px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-danger)', fontWeight: 800 }}>
              Void Line Item: {voidingItem.menuItem?.name}
            </h3>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              Enter mandatory reason for voiding this item in bill correction context.
            </p>
            <Input
              label="Mandatory Void Reason"
              placeholder="e.g. Item was billed incorrectly or cancelled by customer"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="secondary" onClick={() => setVoidingItem(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleConfirmVoid} disabled={isSubmitting}>Confirm Void</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Void & Replace Item Modal */}
      {replaceItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '90%', maxWidth: '440px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-brand)', fontWeight: 800 }}>
              Void & Replace: {replaceItem.menuItem?.name}
            </h3>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              Voids old item and creates a replacement with updated quantity or rate override.
            </p>
            <Input
              label="Mandatory Correction Reason"
              placeholder="e.g. Correcting quantity from 3 to 2"
              value={replaceReason}
              onChange={(e) => setReplaceReason(e.target.value)}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Input
                label="New Correct Quantity"
                type="number"
                min="1"
                value={replaceQty}
                onChange={(e) => setReplaceQty(e.target.value)}
                required
              />
              <Input
                label="Override Rate (₹, optional)"
                type="number"
                step="0.01"
                value={replacePriceRs}
                onChange={(e) => setReplacePriceRs(e.target.value)}
                placeholder={`Standard: ₹${(replaceItem.menuItem?.price / 100).toFixed(2)}`}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="secondary" onClick={() => setReplaceItem(null)}>Cancel</Button>
              <Button onClick={handleConfirmVoidAndReplace} disabled={isSubmitting}>Confirm Void & Replace</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Add New Item to Order Modal */}
      {addingToOrderId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '90%', maxWidth: '440px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-brand)', fontWeight: 800 }}>
              Add New Dish to Order
            </h3>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '4px' }}>Select Menu Item</label>
              <select
                value={selectedMenuItemId}
                onChange={(e) => {
                  setSelectedMenuItemId(e.target.value);
                  const found = menuItems.find((m) => m.id === e.target.value);
                  if (found) setAddPriceRs((found.price / 100).toString());
                }}
                style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', fontWeight: 600 }}
              >
                <option value="">-- Choose Dish from Menu --</option>
                {menuItems.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} — ₹{(m.price / 100).toFixed(2)} ({m.category})</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Input
                label="Quantity"
                type="number"
                min="1"
                value={addQty}
                onChange={(e) => setAddQty(e.target.value)}
                required
              />
              <Input
                label="Price Override (₹, optional)"
                type="number"
                step="0.01"
                value={addPriceRs}
                onChange={(e) => setAddPriceRs(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="secondary" onClick={() => setAddingToOrderId(null)}>Cancel</Button>
              <Button onClick={handleConfirmAddItem} disabled={isSubmitting}>Add Item to Order</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
