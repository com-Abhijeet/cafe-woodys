import { useState, useEffect, useCallback } from 'react';
import {
  listMenuItemsApi,
  createMenuItemApi,
  updateMenuItemApi,
  deleteMenuItemApi,
  uploadMenuItemImageApi
} from '../api/menu.api';

export function useMenu(categoryFilter = null, availableFilter = undefined) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMenu = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await listMenuItemsApi(categoryFilter, availableFilter);
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, availableFilter]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const addMenuItem = async (itemData) => {
    const newItem = await createMenuItemApi(itemData);
    await fetchMenu();
    return newItem;
  };

  const editMenuItem = async (id, itemData) => {
    const updated = await updateMenuItemApi(id, itemData);
    await fetchMenu();
    return updated;
  };

  const removeMenuItem = async (id) => {
    await deleteMenuItemApi(id);
    await fetchMenu();
  };

  const uploadImage = async (id, file) => {
    const updated = await uploadMenuItemImageApi(id, file);
    await fetchMenu();
    return updated;
  };

  return {
    items,
    isLoading,
    error,
    refreshMenu: fetchMenu,
    addMenuItem,
    editMenuItem,
    removeMenuItem,
    uploadImage
  };
}
