import { useState, useEffect, useCallback } from 'react';
import { fetchActiveOrdersApi, updateKitchenStatusApi, cancelOrderApi } from '../api/orders-board.api';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { soundAlerts } from '../../../lib/soundAlerts';

export function useOrdersBoard() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(!soundAlerts.isSoundEnabled());
  const [toastMessage, setToastMessage] = useState(null);

  const { subscribe } = useWebSocket();

  const loadOrders = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchActiveOrdersApi();
      setOrders(res || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const toggleSound = () => {
    const muted = soundAlerts.toggleMute();
    setIsMuted(muted);
  };

  // Real-time WebSocket Listeners with Audio & Visual Alerts
  useEffect(() => {
    const unsubscribeCreated = subscribe('ORDER_CREATED', (payload) => {
      if (payload?.order) {
        soundAlerts.playNewOrderChime();
        setToastMessage(`🔔 New Order! ${payload.order.table?.name || 'Table'} ticket received.`);
        setTimeout(() => setToastMessage(null), 4000);

        setOrders((prev) => {
          const exists = prev.some((o) => o.id === payload.order.id);
          if (exists) return prev;
          return [{ ...payload.order, isNewPulse: true }, ...prev];
        });
      }
    });

    const unsubscribeUpdated = subscribe('ORDER_KITCHEN_STATUS_UPDATED', (payload) => {
      if (payload?.order) {
        if (payload.order.kitchenStatus === 'CANCELLED' || payload.order.status === 'CANCELLED') {
          setOrders((prev) => prev.filter((o) => o.id !== payload.order.id));
          return;
        }

        if (payload.order.kitchenStatus === 'READY') {
          soundAlerts.playOrderReadyPing();
          setToastMessage(`✨ Food READY! ${payload.order.table?.name || 'Table'} order is ready to serve.`);
          setTimeout(() => setToastMessage(null), 5000);
        }

        setOrders((prev) =>
          prev.map((o) => (o.id === payload.order.id ? { ...o, ...payload.order } : o))
        );
      }
    });

    return () => {
      if (unsubscribeCreated) unsubscribeCreated();
      if (unsubscribeUpdated) unsubscribeUpdated();
    };
  }, [subscribe]);

  const advanceKitchenStatus = async (orderId, nextStatus) => {
    try {
      const res = await updateKitchenStatusApi(orderId, nextStatus);
      const updatedOrder = res;
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updatedOrder } : o))
      );
      return updatedOrder;
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
      throw err;
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      await cancelOrderApi(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      alert(`Cancel failed: ${err.message}`);
      throw err;
    }
  };

  return {
    orders,
    isLoading,
    error,
    isMuted,
    toggleSound,
    toastMessage,
    refreshOrders: loadOrders,
    advanceKitchenStatus,
    cancelOrder
  };
}
