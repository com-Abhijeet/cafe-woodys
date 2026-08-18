import { apiClient } from '../../../lib/apiClient';

export async function fetchBillPreviewApi(tableId) {
  return apiClient(`/tables/${tableId}/bill-preview`);
}

export async function generateBillApi(tableId, billData = {}) {
  return apiClient(`/tables/${tableId}/bill`, {
    method: 'POST',
    body: billData
  });
}

export async function addPaymentApi(billId, paymentData) {
  return apiClient(`/bills/${billId}/payments`, {
    method: 'POST',
    body: paymentData
  });
}

export async function updateBillCustomerApi(billId, customerId) {
  return apiClient(`/bills/${billId}/customer`, {
    method: 'PATCH',
    body: { customerId }
  });
}

export async function voidBillApi(billId, reason) {
  return apiClient(`/bills/${billId}/void`, {
    method: 'POST',
    body: { reason }
  });
}

export async function fetchBillApi(id) {
  return apiClient(`/bills/${id}`);
}

export async function listBillsApi(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.tableId) searchParams.append('tableId', params.tableId);
  if (params.customerId) searchParams.append('customerId', params.customerId);
  if (params.paymentStatus && params.paymentStatus !== 'ALL') searchParams.append('paymentStatus', params.paymentStatus);
  if (params.search) searchParams.append('search', params.search);
  if (params.sort) searchParams.append('sort', params.sort);
  if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.append('dateTo', params.dateTo);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return apiClient(`/bills${query}`);
}
