import { useState, useEffect, useCallback } from 'react';
import {
  fetchRecipeApi,
  addRecipeIngredientApi,
  updateRecipeIngredientApi,
  deleteRecipeIngredientApi
} from '../api/recipes.api';

export function useRecipe(menuItemId) {
  const [ingredients, setIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecipe = useCallback(async () => {
    if (!menuItemId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchRecipeApi(menuItemId);
      setIngredients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [menuItemId]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  const addIngredient = async (inventoryItemId, quantity) => {
    const newIng = await addRecipeIngredientApi(menuItemId, { inventoryItemId, quantity });
    await fetchRecipe();
    return newIng;
  };

  const updateIngredient = async (id, quantity) => {
    const updated = await updateRecipeIngredientApi(id, { quantity });
    await fetchRecipe();
    return updated;
  };

  const removeIngredient = async (id) => {
    await deleteRecipeIngredientApi(id);
    await fetchRecipe();
  };

  return {
    ingredients,
    isLoading,
    error,
    refreshRecipe: fetchRecipe,
    addIngredient,
    updateIngredient,
    removeIngredient
  };
}
