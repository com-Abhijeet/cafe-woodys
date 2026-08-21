import { apiClient } from '../../../lib/apiClient';

export async function fetchActiveUnbilledOrdersApi(type = 'all') {
  return apiClient(`/orders/active?type=${type}`);
}
