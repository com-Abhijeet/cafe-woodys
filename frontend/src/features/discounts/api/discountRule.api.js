import { apiClient } from '../../../lib/apiClient';

export async function fetchDiscountRulesApi() {
  return apiClient('/discount-rules');
}

export async function createDiscountRuleApi(payload) {
  return apiClient('/discount-rules', {
    method: 'POST',
    body: payload
  });
}

export async function updateDiscountRuleApi(id, payload) {
  return apiClient(`/discount-rules/${id}`, {
    method: 'PATCH',
    body: payload
  });
}

export async function deleteDiscountRuleApi(id) {
  return apiClient(`/discount-rules/${id}`, {
    method: 'DELETE'
  });
}

export async function fetchDiscountPreviewApi(tableId) {
  return apiClient(`/tables/${tableId}/discount-preview`);
}
