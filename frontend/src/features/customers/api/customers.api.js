import { apiClient } from '../../../lib/apiClient';

export async function searchCustomersApi(searchQuery = '') {
  const query = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
  return apiClient(`/customers${query}`);
}

export async function fetchCustomerByIdApi(id) {
  return apiClient(`/customers/${id}`);
}

export async function createCustomerApi(data) {
  return apiClient('/customers', {
    method: 'POST',
    body: data
  });
}
