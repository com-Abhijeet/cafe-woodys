import { apiClient } from '../../../lib/apiClient';

export async function loginApi(username, password) {
  return apiClient('/auth/login', {
    method: 'POST',
    body: { username, password }
  });
}

export async function fetchMeApi() {
  return apiClient('/auth/me', {
    method: 'GET'
  });
}

export async function createStaffApi(staffData) {
  return apiClient('/auth/staff', {
    method: 'POST',
    body: staffData
  });
}

export async function listStaffApi() {
  return apiClient('/auth/staff', {
    method: 'GET'
  });
}

export async function updateStaffApi(id, staffData) {
  return apiClient(`/auth/staff/${id}`, {
    method: 'PATCH',
    body: staffData
  });
}

export async function toggleStaffStatusApi(id, isActive) {
  return apiClient(`/auth/staff/${id}/status`, {
    method: 'PATCH',
    body: { isActive }
  });
}

export async function resetStaffPasswordApi(id, password) {
  return apiClient(`/auth/staff/${id}/reset-password`, {
    method: 'PATCH',
    body: { password }
  });
}
