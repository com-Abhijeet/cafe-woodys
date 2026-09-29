export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api';

export async function apiClient(endpoint, { body, headers: customHeaders, ...customConfig } = {}) {
  const token = localStorage.getItem('cafe_woodys_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), customConfig.timeout || 12000);

  const config = {
    method: body ? 'POST' : 'GET',
    signal: customConfig.signal || controller.signal,
    ...customConfig,
    headers
  };

  if (body !== undefined) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && (data?.error?.code === 'SESSION_INVALID' || data?.error?.code === 'TOKEN_EXPIRED')) {
        localStorage.removeItem('cafe_woodys_token');
        localStorage.removeItem('cafe_woodys_user');
        window.location.reload();
      }

      const errorMsg = data?.error?.message || 'An error occurred during API request';
      const error = new Error(errorMsg);
      error.status = response.status;
      error.code = data?.error?.code;
      error.details = data?.error?.details;
      throw error;
    }

    return data.data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Request timed out. Please check server/WiFi connection.');
      timeoutErr.code = 'TIMEOUT_ERROR';
      throw timeoutErr;
    }
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      const offlineErr = new Error('Unable to connect to server. Please check network/WiFi connection.');
      offlineErr.code = 'NETWORK_ERROR';
      throw offlineErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function exportFileApi(endpoint, fallbackFilename) {
  const token = localStorage.getItem('cafe_woodys_token');

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      let errorMsg = 'Failed to export CSV file';
      try {
        const data = await response.json();
        errorMsg = data?.error?.message || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fallbackFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server for CSV export. Check network connection.');
    }
    throw err;
  }
}
