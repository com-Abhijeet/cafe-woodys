import { useState, useEffect, useCallback } from 'react';
import {
  listMenuItemsApi,
  createMenuItemApi,
  updateMenuItemApi,
  deleteMenuItemApi,
  uploadMenuItemImageApi
} from '../api/menu.api';

const LOCAL_STORAGE_KEY = 'cafe_woodys_menu_cache';

function getInitialMenuCache() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// Module-level in-memory & persistent menu cache
let menuCache = getInitialMenuCache();
let activeFetchPromise = null;

export function useMenu(categoryFilter = null, availableFilter = undefined) {
  const [items, setItems] = useState(menuCache || []);
  const [isLoading, setIsLoading] = useState(!menuCache);
  const [error, setError] = useState(null);

  const fetchMenu = useCallback(async (forceRefresh = false) => {
    // Only set isLoading to true if we don't already have cached items or explicitly force refresh
    if (!menuCache || forceRefresh) {
      setIsLoading(true);
    }
    setError(null);

    try {
      if (!activeFetchPromise || forceRefresh) {
        activeFetchPromise = listMenuItemsApi();
      }
      const data = await activeFetchPromise;
      if (Array.isArray(data)) {
        menuCache = data;
        setItems(menuCache);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(menuCache));
        } catch (e) {
          console.warn('Failed to save menu cache to localStorage:', e);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load menu items');
    } finally {
      setIsLoading(false);
      activeFetchPromise = null;
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Client-side filtering on cached/fetched items
  let filteredItems = items;
  if (categoryFilter) {
    filteredItems = filteredItems.filter((i) => i.category === categoryFilter);
  }
  if (availableFilter !== undefined) {
    filteredItems = filteredItems.filter((i) => i.isAvailable === availableFilter);
  }

  const addMenuItem = async (itemData) => {
    const newItem = await createMenuItemApi(itemData);
    await fetchMenu(true);
    return newItem;
  };

  const editMenuItem = async (id, itemData) => {
    const updated = await updateMenuItemApi(id, itemData);
    await fetchMenu(true);
    return updated;
  };

  const removeMenuItem = async (id) => {
    await deleteMenuItemApi(id);
    await fetchMenu(true);
  };

  const uploadImage = async (id, file) => {
    const updated = await uploadMenuItemImageApi(id, file);
    await fetchMenu(true);
    return updated;
  };

  return {
    items: filteredItems,
    isLoading: isLoading && items.length === 0, // Only report loading if no items exist to display
    error,
    refreshMenu: () => fetchMenu(true),
    addMenuItem,
    editMenuItem,
    removeMenuItem,
    uploadImage
  };
}
