import { apiClient } from '../../../lib/apiClient';

export async function fetchActiveOrdersApi(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.kitchenStatus && params.kitchenStatus !== 'ALL') searchParams.append('kitchenStatus', params.kitchenStatus);
  if (params.tableId) searchParams.append('tableId', params.tableId);
  if (params.sort) searchParams.append('sort', params.sort);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return apiClient(`/orders${query}`);
}

export async function updateKitchenStatusApi(orderId, kitchenStatus) {
  return apiClient(`/orders/${orderId}/kitchen-status`, {
    method: 'PATCH',
    body: { kitchenStatus }
  });
}

export async function cancelOrderApi(orderId) {
  return apiClient(`/orders/${orderId}/cancel`, {
    method: 'PATCH'
  });
}

export async function closeDayApi(force = false) {
  return apiClient('/orders/close-day', {
    method: 'POST',
    body: { force }
  });
}
