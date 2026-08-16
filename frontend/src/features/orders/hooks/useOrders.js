import { useState, useEffect, useCallback } from 'react';
import { fetchTableOrdersApi, submitTableOrderApi } from '../api/orders.api';

export function useOrders(tableId, statusFilter = 'OPEN') {
  const [orders, setOrders] = useState([]);
  const [unbilledFoodTotal, setUnbilledFoodTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!tableId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchTableOrdersApi(tableId, statusFilter);
      setOrders(data.orders || []);
      setUnbilledFoodTotal(data.unbilledFoodTotal || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [tableId, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const submitOrder = async (items, customerId = null) => {
    const newOrder = await submitTableOrderApi(tableId, items, customerId);
    await fetchOrders();
    return newOrder;
  };

  return {
    orders,
    unbilledFoodTotal,
    isLoading,
    error,
    refreshOrders: fetchOrders,
    submitOrder
  };
}
