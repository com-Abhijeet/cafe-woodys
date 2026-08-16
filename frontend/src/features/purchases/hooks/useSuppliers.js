import { useState, useEffect, useCallback } from 'react';
import {
  listSuppliersApi,
  createSupplierApi,
  updateSupplierApi,
  deleteSupplierApi
} from '../api/suppliers.api';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSuppliers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await listSuppliersApi();
      setSuppliers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const addSupplier = async (data) => {
    const created = await createSupplierApi(data);
    await fetchSuppliers();
    return created;
  };

  const editSupplier = async (id, data) => {
    const updated = await updateSupplierApi(id, data);
    await fetchSuppliers();
    return updated;
  };

  const removeSupplier = async (id) => {
    await deleteSupplierApi(id);
    await fetchSuppliers();
  };

  return {
    suppliers,
    isLoading,
    error,
    refreshSuppliers: fetchSuppliers,
    addSupplier,
    editSupplier,
    removeSupplier
  };
}
