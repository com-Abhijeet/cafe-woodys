import { useState, useEffect, useCallback } from 'react';
import { listPaymentsApi } from '../api/payments.api';

export function usePayments() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalAmountPaise: 0,
    totalCount: 0,
    todayTotalPaise: 0,
    todayCount: 0,
    cashTotalPaise: 0,
    upiTotalPaise: 0,
    cardTotalPaise: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = useCallback(async (filters = {}) => {
    try {
      setError(null);
      const resData = await listPaymentsApi(filters);
      setPayments(resData.payments || []);
      setSummary(resData.summary || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    summary,
    isLoading,
    error,
    refreshPayments: fetchPayments
  };
}
