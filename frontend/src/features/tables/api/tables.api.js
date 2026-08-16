import { apiClient } from '../../../lib/apiClient';

export async function listTablesApi(zoneId) {
  const query = zoneId ? `?zoneId=${zoneId}` : '';
  return apiClient(`/tables${query}`);
}

export async function getTableByIdApi(id) {
  return apiClient(`/tables/${id}`);
}

export async function createTableApi(tableData) {
  return apiClient('/tables', {
    method: 'POST',
    body: tableData
  });
}

export async function updateTableApi(id, tableData) {
  return apiClient(`/tables/${id}`, {
    method: 'PATCH',
    body: tableData
  });
}

export async function deleteTableApi(id) {
  return apiClient(`/tables/${id}`, {
    method: 'DELETE'
  });
}
