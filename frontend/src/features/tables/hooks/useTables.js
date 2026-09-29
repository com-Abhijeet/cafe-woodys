import { useState, useEffect, useCallback } from "react";
import {
  listTablesApi,
  createTableApi,
  updateTableApi,
  deleteTableApi,
} from "../api/tables.api";
import { useWebSocket } from "../../../hooks/useWebSocket";

export function useTables(selectedZoneId = null) {
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { subscribe } = useWebSocket();

  const fetchTables = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoading(true);
      setError(null);
      const data = await listTablesApi(selectedZoneId);
      setTables(data);
    } catch (err) {
      if (!isBackground) setError(err.message);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, [selectedZoneId]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // Realtime WebSocket Subscription
  useEffect(() => {
    const unsubscribe = subscribe("TABLE_UPDATED", () => {
      fetchTables(true);
    });
    return unsubscribe;
  }, [subscribe, fetchTables]);

  const addTable = async (tableData) => {
    const newTable = await createTableApi(tableData);
    await fetchTables();
    return newTable;
  };

  const editTable = async (id, tableData) => {
    const updated = await updateTableApi(id, tableData);
    await fetchTables();
    return updated;
  };

  const removeTable = async (id) => {
    await deleteTableApi(id);
    await fetchTables();
  };

  return {
    tables,
    isLoading,
    error,
    refreshTables: fetchTables,
    addTable,
    editTable,
    removeTable,
  };
}
