import { apiClient } from '../../../lib/apiClient';

export async function fetchActiveGamingSessionsApi(tableId) {
  return apiClient(`/tables/${tableId}/gaming-sessions`);
}

export async function startPlayerSessionApi(tableId, playerLabel) {
  return apiClient(`/tables/${tableId}/gaming-sessions`, {
    method: 'POST',
    body: { playerLabel }
  });
}

export async function closePlayerSessionApi(tableId, sessionId, endTime) {
  return apiClient(`/tables/${tableId}/gaming-sessions/${sessionId}/close`, {
    method: 'PATCH',
    ...(endTime ? { body: { endTime } } : {})
  });
}
