import { apiClient } from '../../../lib/apiClient';

export async function listPurchaseOrdersApi(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.supplierId) searchParams.append('supplierId', params.supplierId);
  if (params.paymentStatus && params.paymentStatus !== 'ALL') searchParams.append('paymentStatus', params.paymentStatus);
  if (params.search) searchParams.append('search', params.search);
  if (params.sort) searchParams.append('sort', params.sort);
  if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.append('dateTo', params.dateTo);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return apiClient(`/purchase-orders${query}`);
}

export async function listPurchasePaymentsApi(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.method && params.method !== 'ALL') searchParams.append('method', params.method);
  if (params.search) searchParams.append('search', params.search);
  if (params.sort) searchParams.append('sort', params.sort);
  if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.append('dateTo', params.dateTo);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return apiClient(`/purchase-payments${query}`);
}

export async function getPurchaseOrderByIdApi(id) {
  return apiClient(`/purchase-orders/${id}`);
}

export async function createPurchaseOrderApi(data) {
  return apiClient('/purchase-orders', {
    method: 'POST',
    body: data
  });
}

export async function addPurchasePaymentApi(id, paymentData) {
  return apiClient(`/purchase-orders/${id}/payments`, {
    method: 'POST',
    body: paymentData
  });
}
