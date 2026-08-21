import { apiClient } from '../../../lib/apiClient';

export async function fetchPrinterConfigsApi() {
  return apiClient('/printer-configs');
}

export async function createPrinterConfigApi(data) {
  return apiClient('/printer-configs', {
    method: 'POST',
    body: data
  });
}

export async function updatePrinterConfigApi(id, data) {
  return apiClient(`/printer-configs/${id}`, {
    method: 'PATCH',
    body: data
  });
}

export async function deletePrinterConfigApi(id) {
  return apiClient(`/printer-configs/${id}`, {
    method: 'DELETE'
  });
}
