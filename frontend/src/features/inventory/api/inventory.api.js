import { apiClient } from '../../../lib/apiClient';

export async function listInventoryItemsApi(belowThreshold) {
  const params = new URLSearchParams();
  if (belowThreshold !== undefined) params.append('belowThreshold', belowThreshold);

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiClient(`/inventory-items${query}`);
}

export async function createInventoryItemApi(itemData) {
  return apiClient('/inventory-items', {
    method: 'POST',
    body: itemData
  });
}

export async function updateInventoryItemApi(id, itemData) {
  return apiClient(`/inventory-items/${id}`, {
    method: 'PATCH',
    body: itemData
  });
}

export async function deleteInventoryItemApi(id) {
  return apiClient(`/inventory-items/${id}`, {
    method: 'DELETE'
  });
}

export async function recordAdjustmentApi(id, adjustmentData) {
  return apiClient(`/inventory-items/${id}/adjustments`, {
    method: 'POST',
    body: adjustmentData
  });
}

export async function fetchItemAdjustmentsApi(id) {
  return apiClient(`/inventory-items/${id}/adjustments`);
}
