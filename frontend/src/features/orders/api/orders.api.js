import { apiClient } from '../../../lib/apiClient';

export async function fetchTableOrdersApi(tableId, status = 'OPEN') {
  return apiClient(`/tables/${tableId}/orders?status=${status}`);
}

export async function submitTableOrderApi(tableId, items, customerId = null) {
  return apiClient(`/tables/${tableId}/orders`, {
    method: 'POST',
    body: { items, customerId }
  });
}

export async function submitParcelOrderApi(items, customerId = null) {
  return apiClient('/orders', {
    method: 'POST',
    body: {
      orderType: 'PARCEL',
      items,
      customerId
    }
  });
}
