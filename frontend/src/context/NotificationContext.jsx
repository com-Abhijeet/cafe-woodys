import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { soundAlerts } from '../lib/soundAlerts';
import { NOTIFICATION_ROUTING, shouldNotifyUser } from '../config/notificationRouting';
import { ToastContainer } from '../components/ui/Toast';
import { apiClient } from '../lib/apiClient';

const NotificationContext = createContext(null);

export function NotificationProvider({ children, onNavigateTab }) {
  const { user } = useAuth();
  const { subscribe } = useWebSocket();
  const [toasts, setToasts] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [readyCount, setReadyCount] = useState(0);

  const role = user?.role || 'WAITER';

  // 1. Initial & Periodic Live Order Counts Query
  const fetchLiveCounts = useCallback(async () => {
    if (!user) return;
    try {
      const orders = await apiClient('/orders');
      const pending = orders.filter((o) => (o.kitchenStatus || 'PENDING') === 'PENDING').length;
      const ready = orders.filter((o) => o.kitchenStatus === 'READY').length;
      setPendingCount(pending);
      setReadyCount(ready);
    } catch (err) {
      console.warn('Failed to fetch live notification badge counts:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchLiveCounts();
  }, [fetchLiveCounts]);

  const addToast = (message, targetTab) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, targetTab }]);

    // Auto-remove after 6 seconds
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 2. Global WebSocket Listener
  useEffect(() => {
    if (!user) return;

    // A. ORDER_CREATED
    const unsubCreated = subscribe('ORDER_CREATED', (payload) => {
      const order = payload?.order;
      if (!order) return;

      setPendingCount((prev) => prev + 1);

      if (shouldNotifyUser('ORDER_CREATED', role)) {
        soundAlerts.playNewOrderChime();
        const msg = NOTIFICATION_ROUTING.ORDER_CREATED.message(order);
        addToast(msg, NOTIFICATION_ROUTING.ORDER_CREATED.targetTab);
      }
    });

    // B. ORDER_KITCHEN_STATUS_UPDATED
    const unsubUpdated = subscribe('ORDER_KITCHEN_STATUS_UPDATED', (payload) => {
      const order = payload?.order;
      if (!order) return;

      fetchLiveCounts();

      if (order.kitchenStatus === 'READY') {
        if (shouldNotifyUser('ORDER_KITCHEN_STATUS_UPDATED_READY', role)) {
          soundAlerts.playOrderReadyPing();
          const msg = NOTIFICATION_ROUTING.ORDER_KITCHEN_STATUS_UPDATED_READY.message(order);
          addToast(msg, NOTIFICATION_ROUTING.ORDER_KITCHEN_STATUS_UPDATED_READY.targetTab);
        }
      }
    });

    // C. INVENTORY_LOW_STOCK
    const unsubLowStock = subscribe('INVENTORY_LOW_STOCK', (payload) => {
      if (shouldNotifyUser('INVENTORY_LOW_STOCK', role)) {
        soundAlerts.playOrderReadyPing();
        const msg = NOTIFICATION_ROUTING.INVENTORY_LOW_STOCK.message(payload || {});
        addToast(msg, NOTIFICATION_ROUTING.INVENTORY_LOW_STOCK.targetTab);
      }
    });

    return () => {
      if (unsubCreated) unsubCreated();
      if (unsubUpdated) unsubUpdated();
      if (unsubLowStock) unsubLowStock();
    };
  }, [user, role, subscribe, fetchLiveCounts]);

  const liveBadgeCount = role === 'KITCHEN' ? pendingCount : readyCount;

  return (
    <NotificationContext.Provider
      value={{
        pendingCount,
        readyCount,
        liveBadgeCount,
        addToast,
        removeToast,
        refreshCounts: fetchLiveCounts
      }}
    >
      {children}
      <ToastContainer
        toasts={toasts}
        onCloseToast={removeToast}
        onViewTab={onNavigateTab}
      />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
