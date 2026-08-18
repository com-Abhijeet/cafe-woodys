import { useState, useEffect, useCallback } from 'react';
import {
  fetchSalesSummaryApi,
  fetchTopItemsApi,
  fetchZonePerformanceApi,
  fetchStaffPerformanceApi,
  fetchPaymentMethodsApi
} from '../api/reports.api';

export function useReports(filters = {}) {
  const { dateFrom, dateTo, groupBy = 'day' } = filters;

  const [salesSummary, setSalesSummary] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [zonePerformance, setZonePerformance] = useState([]);
  const [staffPerformance, setStaffPerformance] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAllReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sales, items, zones, staff, payments] = await Promise.all([
        fetchSalesSummaryApi({ dateFrom, dateTo, groupBy }),
        fetchTopItemsApi({ dateFrom, dateTo, limit: 10 }),
        fetchZonePerformanceApi({ dateFrom, dateTo }),
        fetchStaffPerformanceApi({ dateFrom, dateTo }),
        fetchPaymentMethodsApi({ dateFrom, dateTo })
      ]);

      setSalesSummary(sales || []);
      setTopItems(items || []);
      setZonePerformance(zones || []);
      setStaffPerformance(staff || []);
      setPaymentMethods(payments || []);
    } catch (err) {
      setError(err.message || 'Failed to load report analytics');
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, groupBy]);

  useEffect(() => {
    loadAllReports();
  }, [loadAllReports]);

  return {
    salesSummary,
    topItems,
    zonePerformance,
    staffPerformance,
    paymentMethods,
    isLoading,
    error,
    refreshReports: loadAllReports
  };
}
