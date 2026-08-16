import { apiClient } from '../../../lib/apiClient';

export async function listSuppliersApi() {
  return apiClient('/suppliers');
}

export async function createSupplierApi(data) {
  return apiClient('/suppliers', {
    method: 'POST',
    body: data
  });
}

export async function updateSupplierApi(id, data) {
  return apiClient(`/suppliers/${id}`, {
    method: 'PATCH',
    body: data
  });
}

export async function deleteSupplierApi(id) {
  return apiClient(`/suppliers/${id}`, {
    method: 'DELETE'
  });
}
