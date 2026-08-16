import { apiClient } from '../../../lib/apiClient';

export async function listZonesApi() {
  return apiClient('/zones');
}

export async function getZoneByIdApi(id) {
  return apiClient(`/zones/${id}`);
}

export async function createZoneApi(zoneData) {
  return apiClient('/zones', {
    method: 'POST',
    body: zoneData
  });
}

export async function updateZoneApi(id, zoneData) {
  return apiClient(`/zones/${id}`, {
    method: 'PATCH',
    body: zoneData
  });
}

export async function deleteZoneApi(id) {
  return apiClient(`/zones/${id}`, {
    method: 'DELETE'
  });
}
