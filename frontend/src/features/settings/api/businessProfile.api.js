import { apiClient } from '../../../lib/apiClient';

export async function fetchBusinessProfileApi() {
  return apiClient('/business-profile');
}

export async function updateBusinessProfileApi(payload) {
  return apiClient('/business-profile', {
    method: 'PATCH',
    body: payload
  });
}
