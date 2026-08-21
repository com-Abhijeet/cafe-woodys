import { apiClient } from '../../../lib/apiClient';

export async function fetchKitchenPrintSettingsApi() {
  return apiClient('/kitchen-print-settings');
}

export async function updateKitchenPrintSettingsApi(payload) {
  return apiClient('/kitchen-print-settings', {
    method: 'PATCH',
    body: payload
  });
}
