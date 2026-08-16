import { apiClient } from '../../../lib/apiClient';

export async function fetchRecipeApi(menuItemId) {
  return apiClient(`/menu-items/${menuItemId}/recipe`);
}

export async function addRecipeIngredientApi(menuItemId, { inventoryItemId, quantity }) {
  return apiClient(`/menu-items/${menuItemId}/recipe`, {
    method: 'POST',
    body: { inventoryItemId, quantity }
  });
}

export async function updateRecipeIngredientApi(id, { quantity }) {
  return apiClient(`/recipe-ingredients/${id}`, {
    method: 'PATCH',
    body: { quantity }
  });
}

export async function deleteRecipeIngredientApi(id) {
  return apiClient(`/recipe-ingredients/${id}`, {
    method: 'DELETE'
  });
}
