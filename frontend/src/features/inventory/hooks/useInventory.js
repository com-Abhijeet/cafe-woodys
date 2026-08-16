import { useState, useEffect, useCallback } from 'react';
import {
  listInventoryItemsApi,
  createInventoryItemApi,
  updateInventoryItemApi,
  deleteInventoryItemApi,
  recordAdjustmentApi,
  fetchItemAdjustmentsApi
} from '../api/inventory.api';

export function useInventory(belowThresholdFilter = undefined) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await listInventoryItemsApi(belowThresholdFilter);
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [belowThresholdFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addInventoryItem = async (itemData) => {
    const newItem = await createInventoryItemApi(itemData);
    await fetchItems();
    return newItem;
  };

  const editInventoryItem = async (id, itemData) => {
    const updated = await updateInventoryItemApi(id, itemData);
    await fetchItems();
    return updated;
  };

  const removeInventoryItem = async (id) => {
    await deleteInventoryItemApi(id);
    await fetchItems();
  };

  const adjustStock = async (id, adjustmentData) => {
    const result = await recordAdjustmentApi(id, adjustmentData);
    await fetchItems();
    return result;
  };

  const getItemAuditHistory = async (id) => {
    return fetchItemAdjustmentsApi(id);
  };

  const lowStockCount = items.filter((i) => i.isLowStock).length;

  return {
    items,
    lowStockCount,
    isLoading,
    error,
    refreshInventory: fetchItems,
    addInventoryItem,
    editInventoryItem,
    removeInventoryItem,
    adjustStock,
    getItemAuditHistory
  };
}
