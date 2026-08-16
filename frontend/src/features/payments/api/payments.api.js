import { apiClient } from '../../../lib/apiClient';

export async function listPaymentsApi(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.method && params.method !== 'ALL') searchParams.append('method', params.method);
  if (params.search) searchParams.append('search', params.search);
  if (params.sort) searchParams.append('sort', params.sort);
  if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.append('dateTo', params.dateTo);
  if (params.staffId) searchParams.append('staffId', params.staffId);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return apiClient(`/payments${query}`);
}
