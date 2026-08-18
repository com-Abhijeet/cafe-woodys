import { apiClient } from '../../../lib/apiClient';

export async function fetchSalesSummaryApi(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.append('dateTo', params.dateTo);
  if (params.groupBy) searchParams.append('groupBy', params.groupBy);
  const q = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return apiClient(`/reports/sales-summary${q}`);
}

export async function fetchTopItemsApi(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.append('dateTo', params.dateTo);
  if (params.limit) searchParams.append('limit', params.limit);
  const q = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return apiClient(`/reports/top-items${q}`);
}

export async function fetchZonePerformanceApi(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.append('dateTo', params.dateTo);
  const q = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return apiClient(`/reports/zone-performance${q}`);
}

export async function fetchStaffPerformanceApi(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.append('dateTo', params.dateTo);
  const q = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return apiClient(`/reports/staff-performance${q}`);
}

export async function fetchPaymentMethodsApi(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.append('dateTo', params.dateTo);
  const q = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return apiClient(`/reports/payment-methods${q}`);
}
