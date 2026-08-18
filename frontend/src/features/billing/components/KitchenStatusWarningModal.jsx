import { AlertTriangle, Clock, ChefHat, Check } from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';

export function KitchenStatusWarningModal({ unfinishedOrders, onCancel, onConfirmOverride, isSubmitting }) {
  if (!unfinishedOrders || unfinishedOrders.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1300,
      padding: 'var(--space-3)'
    }}>
      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: '2px solid var(--color-warning)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        maxWidth: '480px',
        width: '100%',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-warning)', marginBottom: 'var(--space-2)' }}>
          <AlertTriangle size={24} />
          <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 800 }}>
            Kitchen Orders Still Unfinished!
          </h3>
        </div>

        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>
          This table has food/drink items currently being prepared in the kitchen. Generating a bill will lock the table and mark orders as billed.
        </p>

        {/* Unfinished Orders Itemized List */}
        <div style={{ backgroundColor: 'var(--color-bg)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', maxHeight: '180px', overflowY: 'auto', marginBottom: '16px' }}>
          {unfinishedOrders.map((ord) => (
            <div key={ord.orderId} style={{ marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px dashed var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 700 }}>
                <span style={{ color: 'var(--color-brand)' }}>Ticket #{ord.orderId.slice(-4).toUpperCase()}</span>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: ord.kitchenStatus === 'READY' ? 'rgba(46,204,113,0.15)' : 'rgba(230,126,34,0.15)',
                  color: ord.kitchenStatus === 'READY' ? 'var(--color-success)' : 'var(--color-warning)'
                }}>
                  Status: {ord.kitchenStatus}
                </span>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', marginTop: '4px', color: 'var(--color-text-primary)' }}>
                {ord.items.map((i, idx) => (
                  <div key={idx}>• {i.quantity}x {i.name}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Wait for Kitchen
          </Button>
          <Button variant="danger" onClick={onConfirmOverride} disabled={isSubmitting}>
            {isSubmitting ? 'Generating...' : 'Generate Bill Anyway'}
          </Button>
        </div>
      </div>
    </div>
  );
}
