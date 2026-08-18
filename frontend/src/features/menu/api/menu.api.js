import { apiClient, BASE_URL } from '../../../lib/apiClient';

export async function listMenuItemsApi(category, available) {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (available !== undefined) params.append('available', available);

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiClient(`/menu-items${query}`);
}

export async function createMenuItemApi(itemData) {
  return apiClient('/menu-items', {
    method: 'POST',
    body: itemData
  });
}

export async function updateMenuItemApi(id, itemData) {
  return apiClient(`/menu-items/${id}`, {
    method: 'PATCH',
    body: itemData
  });
}

export async function deleteMenuItemApi(id) {
  return apiClient(`/menu-items/${id}`, {
    method: 'DELETE'
  });
}

export async function uploadMenuItemImageApi(id, file) {
  const formData = new FormData();
  formData.append('image', file);

  const token = localStorage.getItem('cafe_woodys_token');
  const response = await fetch(`${BASE_URL}/menu-items/${id}/image`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error?.message || 'Failed to upload menu item image');
  }
  return json.data;
}
