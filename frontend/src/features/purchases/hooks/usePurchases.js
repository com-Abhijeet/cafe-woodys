import { useState, useCallback } from 'react';
import {
  listPurchaseOrdersApi,
  listPurchasePaymentsApi,
  getPurchaseOrderByIdApi,
  createPurchaseOrderApi,
  addPurchasePaymentApi
} from '../api/purchases.api';

export function usePurchases() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [purchasePayments, setPurchasePayments] = useState([]);
  const [paymentsSummary, setPaymentsSummary] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPurchaseOrders = useCallback(async (filters = {}) => {
    try {
      setError(null);
      const data = await listPurchaseOrdersApi(filters);
      setPurchaseOrders(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPurchasePayments = useCallback(async (filters = {}) => {
    try {
      setError(null);
      const res = await listPurchasePaymentsApi(filters);
      setPurchasePayments(res.payments || []);
      setPaymentsSummary(res.summary || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addPurchaseOrder = async (data) => {
    const created = await createPurchaseOrderApi(data);
    await fetchPurchaseOrders();
    return created;
  };

  const addSupplierPayment = async (poId, paymentData) => {
    const updated = await addPurchasePaymentApi(poId, paymentData);
    await fetchPurchaseOrders();
    return updated;
  };

  const getPODetail = async (id) => {
    return getPurchaseOrderByIdApi(id);
  };

  return {
    purchaseOrders,
    purchasePayments,
    paymentsSummary,
    isLoading,
    error,
    refreshPurchaseOrders: fetchPurchaseOrders,
    refreshPurchasePayments: fetchPurchasePayments,
    addPurchaseOrder,
    addSupplierPayment,
    getPODetail
  };
}
