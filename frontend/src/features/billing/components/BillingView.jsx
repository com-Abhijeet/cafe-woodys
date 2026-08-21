import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { printReceipt, printKitchenSlip } from '../../../lib/print/PrintService';
import { CustomerResolveField } from '../../customers/components/CustomerResolveField';
import { KitchenStatusWarningModal } from './KitchenStatusWarningModal';
import { PaymentModal } from './PaymentModal';
import { QuickConfigModal } from './QuickConfigModal';
import { CategorySidebar } from '../../tables/components/CategorySidebar';
import { MenuItemGrid } from '../../tables/components/MenuItemGrid';
import { useMenu } from '../../menu/hooks/useMenu';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import {
  ArrowLeft,
  Printer,
  CreditCard,
  QrCode,
  DollarSign,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Receipt,
  Building,
  Phone,
  FileText,
  Settings,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  SlidersHorizontal,
  Utensils,
  Eye
} from 'lucide-react';
import styles from './CheckoutModal.module.css';

const getRemainingPaise = (b) => {
  if (!b) return 0;
  if (typeof b.remainingBalance === 'number') return b.remainingBalance;
  if (typeof b.grandTotal === 'number') return b.grandTotal;
  if (typeof b.foodTotal === 'number') return b.foodTotal;
  return 0;
};

/**
 * Phase 22 Unified Billing & Live Editing Workspace
 * 1. Left Side (70-75%): Category Sidebar + Menu Item Grid (Always visible for live 1-tap dish addition)
 * 2. Right Side (25-30%): Unified Order Items List (Live + / - / void) + Receipt Preview + Payment Settlement
 * 3. Sticky Bottom Action Bar with "Save Bill" 1-transaction commit, Quick Config & Payment Modal
 */
export function BillingView({ tableId, initialBill = null, onBack, onBillSettled }) {
  const [bill, setBill] = useState(initialBill);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(!initialBill);
  const [error, setError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Right Side Workspace Tab: 'LIVE_ITEMS' | 'RECEIPT_PREVIEW'
  const [rightPanelTab, setRightPanelTab] = useState('LIVE_ITEMS');

  // Payment Form & Override State
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isCustomPaymentMode, setIsCustomPaymentMode] = useState(false);
  const [customPaymentObj, setCustomPaymentObj] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQuickConfigModal, setShowQuickConfigModal] = useState(false);
  const [showKitchenModal, setShowKitchenModal] = useState(false);
  const [unfinishedKitchenOrders, setUnfinishedKitchenOrders] = useState([]);

  // Shared Left-side Item Selector State
  const { items: menuItems, isLoading: isMenuLoading } = useMenu();
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = Array.from(new Set(menuItems.map((m) => m.category))).filter(Boolean);
  const filteredMenuItems = selectedCategory === 'ALL'
    ? menuItems.filter((m) => m.isAvailable)
    : menuItems.filter((m) => m.isAvailable && m.category === selectedCategory);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profRes, previewRes] = await Promise.all([
        apiClient('/business-profile').catch(() => null),
        tableId ? apiClient(`/tables/${tableId}/bill-preview`).catch(() => null) : Promise.resolve(null)
      ]);

      if (profRes) setBusinessProfile(profRes);

      const targetData = previewRes || initialBill;
      if (targetData) {
        setBill(targetData);
      }
    } catch (err) {
      setError(err.message || 'Failed to load billing preview');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tableId, initialBill?.id]);

  // Normalize display orders list across all open orders for this table/parcel
  const displayOrders = bill?.orders?.length > 0
    ? bill.orders
    : (bill?.items?.length > 0 ? [bill] : []);

  // Consolidate all non-voided active items across open orders into a single list
  const activeLineItems = [];
  displayOrders.forEach((ord) => {
    (ord.items || []).forEach((item) => {
      if (!item.voidedAt) {
        activeLineItems.push({
          ...item,
          orderId: ord.id
        });
      }
    });
  });

  // Derived Totals
  const foodTotalPaise = bill?.foodTotal ?? activeLineItems.reduce((sum, i) => sum + ((i.priceSnapshot || i.menuItem?.price || 0) * i.quantity), 0);
  const gamingTotalPaise = bill?.gamingTotal ?? 0;
  const grandTotalPaise = bill?.grandTotal ?? Math.max(0, foodTotalPaise + gamingTotalPaise - (bill?.discountAmount || 0) + (bill?.cgstAmount || 0) + (bill?.sgstAmount || 0));
  const totalPaidPaise = bill?.totalPaid ?? (bill?.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const remainingPaise = bill?.remainingBalance ?? Math.max(0, grandTotalPaise - totalPaidPaise);

  const grandTotalRs = (grandTotalPaise / 100).toFixed(2);
  const foodTotalRs = (foodTotalPaise / 100).toFixed(2);
  const gamingTotalRs = (gamingTotalPaise / 100).toFixed(2);
  const totalPaidRs = (totalPaidPaise / 100).toFixed(2);
  const remainingRs = (remainingPaise / 100).toFixed(2);
  const isFullyPaid = bill?.paymentStatus === 'PAID' || (grandTotalPaise > 0 && remainingPaise === 0);

  // In-line Item Modification Handlers (Real-time edit without leaving screen)
  const handleIncreaseQty = async (item) => {
    try {
      await apiClient(`/order-items/${item.id}/void-and-replace`, {
        method: 'POST',
        body: {
          reason: 'Quantity increased at billing',
          replacement: { quantity: item.quantity + 1 }
        }
      });
      loadData();
    } catch (err) {
      setError('Failed to increase quantity: ' + err.message);
    }
  };

  const handleDecreaseQty = async (item) => {
    try {
      if (item.quantity > 1) {
        await apiClient(`/order-items/${item.id}/void-and-replace`, {
          method: 'POST',
          body: {
            reason: 'Quantity decreased at billing',
            replacement: { quantity: item.quantity - 1 }
          }
        });
      } else {
        await apiClient(`/order-items/${item.id}/void`, {
          method: 'PATCH',
          body: { reason: 'Item voided at billing' }
        });
      }
      loadData();
    } catch (err) {
      setError('Failed to adjust item: ' + err.message);
    }
  };

  const handleVoidLineItem = async (item) => {
    if (!confirm(`Are you sure you want to void ${item.menuItem?.name || 'this item'}?`)) return;
    try {
      await apiClient(`/order-items/${item.id}/void`, {
        method: 'PATCH',
        body: { reason: 'Item voided at billing' }
      });
      loadData();
    } catch (err) {
      setError('Failed to void item: ' + err.message);
    }
  };

  // Shared Menu Item Selector Tap Handler (Left Side 75%)
  const handleMenuItemTap = async (menuItem) => {
    const existing = activeLineItems.find((i) => i.menuItemId === menuItem.id || i.menuItem?.id === menuItem.id);
    if (existing) {
      await handleIncreaseQty(existing);
      return;
    }

    try {
      if (displayOrders.length > 0 && displayOrders[0].id) {
        await apiClient(`/orders/${displayOrders[0].id}/items`, {
          method: 'POST',
          body: {
            menuItemId: menuItem.id,
            quantity: 1
          }
        });
      } else if (tableId) {
        await apiClient(`/tables/${tableId}/orders`, {
          method: 'POST',
          body: {
            items: [{ menuItemId: menuItem.id, quantity: 1 }]
          }
        });
      }
      loadData();
    } catch (err) {
      setError('Failed to add item to bill: ' + err.message);
    }
  };

  // Phase 22 Step 1: "Save Bill" — single transaction commit + payment
  const handleSaveBill = async (overridePayment = null, ignoreKitchenWarning = false) => {
    setIsSubmitting(true);
    setError('');

    try {
      const targetId = tableId || bill?.table?.id || bill?.tableId || bill?.id;
      if (!targetId) throw new Error('No target table or order ID found');

      // Determine payment payload
      let paymentPayload = null;
      if (overridePayment) {
        paymentPayload = overridePayment;
      } else if (customPaymentObj) {
        paymentPayload = customPaymentObj;
      } else if (businessProfile?.autoMarkBillsPaidInFull || !isCustomPaymentMode) {
        paymentPayload = {
          amount: grandTotalPaise,
          method: paymentMethod,
          reference: 'Instant Save Bill Settlement'
        };
      }

      // Single API Call -> Single Database Transaction
      const savedBill = await apiClient(`/tables/${targetId}/bill`, {
        method: 'POST',
        body: {
          discountAmount: bill?.discountAmount || 0,
          discountReason: bill?.discountReason || null,
          customerId: bill?.customer?.id || bill?.customerId || null,
          payment: paymentPayload,
          ignoreKitchenWarning
        }
      });

      if (!savedBill) throw new Error('Failed to save bill');

      setBill(savedBill);
      setShowKitchenModal(false);
      setShowPaymentModal(false);

      // Always print KOT slip for parcel/takeaway bills if kitchen print settings are enabled
      const isParcel = savedBill.orderType === 'PARCEL' || !savedBill.table;
      if (isParcel) {
        try {
          const ksRes = await apiClient('/kitchen-print-settings').catch(() => null);
          if (ksRes?.printWithParcelBill || ksRes?.printOnEveryOrder) {
            printKitchenSlip(savedBill).catch((err) => console.error('KOT auto-print error:', err));
          }
        } catch {}
      }

      if (businessProfile?.alwaysSaveAndPrint) {
        try {
          await printReceipt(savedBill);
        } catch (pErr) {
          console.error('Auto-print error:', pErr);
        }
      }

      if (isParcel) {
        setSuccessBanner('Bill Saved & Settled! Starting new takeaway order...');
        setTimeout(() => {
          setSuccessBanner('');
          if (onBillSettled) onBillSettled(savedBill);
        }, 1500);
      } else {
        setSuccessBanner('Bill Saved & Settled! Returning to active bills / floor plan...');
        setTimeout(() => {
          setSuccessBanner('');
          if (onBillSettled) onBillSettled(savedBill);
          if (onBack) onBack();
        }, 1500);
      }
    } catch (err) {
      if (err.code === 'KITCHEN_NOT_FINISHED' && err.data?.unfinishedOrders) {
        setUnfinishedKitchenOrders(err.data.unfinishedOrders);
        setShowKitchenModal(true);
      } else {
        setError(err.message || 'Failed to save bill');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (customerId) => {
    if (!bill?.id) return;
    try {
      const res = await apiClient(`/bills/${bill.id}/customer`, {
        method: 'PATCH',
        body: { customerId }
      });
      setBill(res.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePrintReceipt = async () => {
    if (!bill) return;
    setIsPrinting(true);
    try {
      await printReceipt(bill);
    } catch (err) {
      setError('Failed to print receipt: ' + err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintKitchenSlip = async () => {
    if (!bill) return;
    setIsPrinting(true);
    try {
      await printKitchenSlip(bill);
    } catch (err) {
      setError('Failed to print kitchen slip: ' + err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: 'var(--space-5)', textAlign: 'center', backgroundColor: 'var(--color-bg)', height: '100%' }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Loading unified billing workspace...</p>
      </div>
    );
  }

  const saveButtonLabel = isFullyPaid
    ? 'Bill Settled (Paid)'
    : customPaymentObj
      ? `Save Bill — Paid ₹${(customPaymentObj.amount / 100).toFixed(2)} (${customPaymentObj.method})`
      : isCustomPaymentMode
        ? 'Save Bill — Unpaid / Tab'
        : `Save Bill — Paid (${paymentMethod})`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-bg)', position: 'relative' }}>
      {/* Top Header Bar */}
      <div style={{
        height: '56px',
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
            <ArrowLeft size={16} /> Back
          </Button>

          <div>
            <h2 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-brand)' }}>
              {bill?.orderType === 'PARCEL' || !bill?.table ? 'Takeaway / Parcel Billing' : `Table Billing — ${bill?.table?.name || 'Dine-In'}`}
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              Invoice #{bill?.invoiceNumber || bill?.dailyOrderNumber || bill?.id?.slice(-6) || 'Draft'} • Status: <strong style={{ color: isFullyPaid ? 'var(--color-success)' : 'var(--color-brand)' }}>{bill?.paymentStatus || (isFullyPaid ? 'PAID' : 'UNPAID')}</strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button variant="secondary" onClick={handlePrintKitchenSlip} disabled={isPrinting} style={{ fontSize: 'var(--text-xs)', gap: '4px' }}>
            <FileText size={14} /> KOT Slip
          </Button>

          <Button onClick={handlePrintReceipt} disabled={isPrinting} style={{ fontSize: 'var(--text-xs)', gap: '4px' }}>
            <Printer size={14} /> Print Receipt
          </Button>
        </div>
      </div>

      {/* Main 2-Column Grid: LEFT 70-75% MENU ITEM SELECTOR, RIGHT 25-30% UNIFIED BILL & ITEMS */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 440px', gap: 'var(--space-3)', padding: 'var(--space-3)', overflow: 'hidden' }}>

        {/* LEFT SIDE (70-75% Width): Menu Items Selector (Tap to auto-add or increase dish) */}
        <div style={{ display: 'flex', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <CategorySidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            totalItemsCount={menuItems.length}
          />
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Tap any dish to instantly add to bill or increase quantity:
            </div>
            <MenuItemGrid
              menuItems={filteredMenuItems}
              cart={activeLineItems.map((i) => ({ menuItem: i.menuItem || { id: i.menuItemId }, quantity: i.quantity }))}
              onAddToCart={handleMenuItemTap}
              onUpdateCartQty={(itemId, delta) => {
                const item = activeLineItems.find((i) => i.menuItemId === itemId || i.menuItem?.id === itemId);
                if (item) {
                  if (delta > 0) handleIncreaseQty(item);
                  else handleDecreaseQty(item);
                }
              }}
              isLoading={isMenuLoading}
            />
          </div>
        </div>

        {/* RIGHT SIDE (25-30% Width / 440px): UNIFIED BILL & REALTIME EDITING WORKSPACE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', overflowY: 'auto' }}>

          {/* Right Panel View Toggle Tabs */}
          <div style={{ display: 'flex', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '3px', border: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setRightPanelTab('LIVE_ITEMS')}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: rightPanelTab === 'LIVE_ITEMS' ? 'var(--color-brand)' : 'transparent',
                color: rightPanelTab === 'LIVE_ITEMS' ? '#fff' : 'var(--color-text-secondary)',
                fontWeight: 700,
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <Utensils size={14} /> Live Bill Items ({activeLineItems.length})
            </button>
            <button
              onClick={() => setRightPanelTab('RECEIPT_PREVIEW')}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: rightPanelTab === 'RECEIPT_PREVIEW' ? 'var(--color-brand)' : 'transparent',
                color: rightPanelTab === 'RECEIPT_PREVIEW' ? '#fff' : 'var(--color-text-secondary)',
                fontWeight: 700,
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <Eye size={14} /> Receipt Paper Preview
            </button>
          </div>

          {successBanner && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(39,174,96,0.15)',
              color: 'var(--color-success)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-success)',
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle2 size={16} /> {successBanner}
            </div>
          )}

          {error && <div className={styles.errorMessage}><AlertCircle size={16} /> {error}</div>}

          {/* Customer CRM Widget */}
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <UserCheck size={14} /> Customer CRM Profile
            </div>
            <CustomerResolveField
              selectedCustomer={bill?.customer}
              onSelectCustomer={(c) => handleUpdateCustomer(c?.id || null)}
              onClearCustomer={() => handleUpdateCustomer(null)}
            />
          </div>

          {rightPanelTab === 'LIVE_ITEMS' ? (
            /* TAB 1: Live Unified Order Items & Direct In-Line Quantity Controls */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flex: 1 }}>
              <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-brand)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Unified Bill Dishes ({activeLineItems.length})</span>
                  <span>Subtotal: ₹{foodTotalRs}</span>
                </div>

                {activeLineItems.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    No dishes on this bill yet. Tap any item on the left menu to add!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                    {activeLineItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          backgroundColor: 'var(--color-bg)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                          <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.menuItem?.name || 'Food Dish'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            ₹{(((item.priceSnapshot || item.menuItem?.price || 0)) / 100).toFixed(0)} / portion
                          </div>
                        </div>

                        {/* In-Line Quantity Controls (+ / - / void) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleDecreaseQty(item)}
                            style={{
                              border: '1px solid var(--color-border)',
                              backgroundColor: 'var(--color-surface)',
                              borderRadius: '4px',
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Minus size={12} />
                          </button>

                          <span style={{ fontWeight: 800, fontSize: 'var(--text-xs)', minWidth: '16px', textAlign: 'center' }}>
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => handleIncreaseQty(item)}
                            style={{
                              border: '1px solid var(--color-border)',
                              backgroundColor: 'var(--color-surface)',
                              borderRadius: '4px',
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Plus size={12} />
                          </button>

                          <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--color-brand)', minWidth: '54px', textAlign: 'right' }}>
                            ₹{(((item.priceSnapshot || item.menuItem?.price || 0) * item.quantity) / 100).toFixed(2)}
                          </strong>

                          <button
                            onClick={() => handleVoidLineItem(item)}
                            title="Void dish"
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-danger)', padding: '2px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Settlement Card */}
              <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-brand)' }}>Payment Method</span>
                  <Button variant="secondary" onClick={() => setShowPaymentModal(true)} style={{ fontSize: '10px', padding: '2px 6px', gap: '2px' }}>
                    <SlidersHorizontal size={12} /> Custom Payment / Split
                  </Button>
                </div>

                {isFullyPaid ? (
                  <div style={{ padding: '8px', backgroundColor: 'rgba(39,174,96,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-success)', textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-success)' }}>BILL PAID IN FULL (₹{grandTotalRs})</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {[
                      { key: 'CASH', label: 'Cash', icon: DollarSign },
                      { key: 'UPI', label: 'UPI', icon: QrCode },
                      { key: 'CARD', label: 'Card', icon: CreditCard },
                      { key: 'OTHER', label: 'Other', icon: Receipt }
                    ].map((m) => {
                      const Icon = m.icon;
                      const isSel = paymentMethod === m.key && !customPaymentObj;
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(m.key);
                            setCustomPaymentObj(null);
                            setIsCustomPaymentMode(false);
                          }}
                          style={{
                            padding: '6px 2px',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${isSel ? 'var(--color-brand)' : 'var(--color-border)'}`,
                            backgroundColor: isSel ? 'rgba(44,62,80,0.1)' : 'var(--color-bg)',
                            color: isSel ? 'var(--color-brand)' : 'var(--color-text-primary)',
                            fontWeight: isSel ? 800 : 600,
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          <Icon size={14} /> {m.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: Authentic Thermal Receipt Paper Preview */
            <div style={{
              backgroundColor: '#ffffff',
              color: '#111111',
              borderRadius: '4px',
              padding: '16px 14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: '12px',
              lineHeight: '1.4',
              borderTop: '4px solid var(--color-brand)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '15px', textTransform: 'uppercase' }}>
                  {businessProfile?.businessName || "CAFE WOODY'S"}
                </div>
                {businessProfile?.address && <div style={{ fontSize: '10px' }}>{businessProfile.address}</div>}
              </div>

              <div style={{ borderBottom: '1px dashed #111', margin: '6px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Inv: #{bill?.invoiceNumber || bill?.dailyOrderNumber || bill?.id?.slice(-6) || 'Draft'}</span>
                <span>Date: {new Date(bill?.createdAt || Date.now()).toLocaleDateString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Type: {bill?.orderType === 'PARCEL' || !bill?.table ? 'TAKEAWAY' : `TABLE ${bill?.table?.name || ''}`}</span>
                <span>Staff: {bill?.staff?.username || 'Counter'}</span>
              </div>

              <div style={{ borderBottom: '1px dashed #111', margin: '6px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11px' }}>
                <span>ITEM</span>
                <span>QTY x RATE</span>
                <span>AMT (₹)</span>
              </div>
              <div style={{ borderBottom: '1px solid #111', margin: '4px 0' }} />

              {activeLineItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                  <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.menuItem?.name || 'Item'}</span>
                  <span>{item.quantity} x {((item.priceSnapshot || item.menuItem?.price || 0) / 100).toFixed(0)}</span>
                  <span>{(((item.priceSnapshot || item.menuItem?.price || 0) * item.quantity) / 100).toFixed(2)}</span>
                </div>
              ))}

              <div style={{ borderBottom: '1px dashed #111', margin: '6px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                <span>GRAND TOTAL:</span>
                <span>₹{grandTotalRs}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: '60px',
        backgroundColor: 'var(--color-surface)',
        borderTop: '2px solid var(--color-border)',
        padding: '0 var(--space-4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={() => setShowQuickConfigModal(true)}
            title="Quick Billing Settings"
            style={{
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-md)',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-brand)'
            }}
          >
            <Settings size={20} />
          </button>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>TOTAL DUE</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-brand)' }}>
              ₹{remainingRs}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button
            onClick={() => handleSaveBill()}
            disabled={isSubmitting || isFullyPaid}
            style={{
              padding: '12px 24px',
              fontSize: 'var(--text-sm)',
              fontWeight: 800,
              backgroundColor: 'var(--color-brand)',
              minWidth: '220px'
            }}
          >
            {isSubmitting ? 'Saving Bill...' : saveButtonLabel}
          </Button>

          <Button variant="secondary" onClick={handlePrintReceipt} disabled={isPrinting}>
            <Printer size={16} /> Print
          </Button>
        </div>
      </div>

      {/* Modals */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          remainingRs={remainingRs}
          defaultMethod={paymentMethod}
          onSubmitPayment={(pObj) => {
            setCustomPaymentObj(pObj);
            setIsCustomPaymentMode(true);
            setShowPaymentModal(false);
            handleSaveBill(pObj);
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {showQuickConfigModal && (
        <QuickConfigModal
          isOpen={showQuickConfigModal}
          onClose={() => setShowQuickConfigModal(false)}
          businessProfile={businessProfile}
          onProfileUpdated={(p) => setBusinessProfile(p)}
        />
      )}

      {showKitchenModal && (
        <KitchenStatusWarningModal
          unfinishedOrders={unfinishedKitchenOrders}
          onCancel={() => setShowKitchenModal(false)}
          onConfirmOverride={() => handleSaveBill(null, true)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
