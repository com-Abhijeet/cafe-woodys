import { useState, useCallback } from 'react';
import {
  generateBillApi,
  addPaymentApi,
  updateBillCustomerApi,
  voidBillApi,
  fetchBillApi,
  listBillsApi
} from '../api/billing.api';

export function useBilling() {
  const [currentBill, setCurrentBill] = useState(null);
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const createBill = async (tableId, options = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const bill = await generateBillApi(tableId, options);
      setCurrentBill(bill);
      return bill;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const submitPayment = async (billId, paymentData) => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await addPaymentApi(billId, paymentData);
      setCurrentBill(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const attachCustomerToBill = async (billId, customerId) => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await updateBillCustomerApi(billId, customerId);
      setCurrentBill(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const voidBill = async (billId, reason) => {
    try {
      setIsLoading(true);
      setError(null);
      const voided = await voidBillApi(billId, reason);
      setCurrentBill(voided);
      return voided;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadBill = async (billId) => {
    try {
      setIsLoading(true);
      setError(null);
      const bill = await fetchBillApi(billId);
      setCurrentBill(bill);
      return bill;
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBillsList = useCallback(async (filters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await listBillsApi(filters);
      setBills(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    currentBill,
    bills,
    isLoading,
    error,
    createBill,
    submitPayment,
    attachCustomerToBill,
    voidBill,
    loadBill,
    loadBillsList
  };
}
