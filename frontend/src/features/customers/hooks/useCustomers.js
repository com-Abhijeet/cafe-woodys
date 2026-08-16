import { useState, useEffect, useCallback } from 'react';
import { searchCustomersApi, fetchCustomerByIdApi, createCustomerApi } from '../api/customers.api';

export function useCustomers(searchQuery = '') {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await searchCustomersApi(searchQuery);
      setCustomers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const addCustomer = async (data) => {
    const newCust = await createCustomerApi(data);
    await fetchCustomers();
    return newCust;
  };

  const getCustomerProfile = async (id) => {
    return fetchCustomerByIdApi(id);
  };

  return {
    customers,
    isLoading,
    error,
    refreshCustomers: fetchCustomers,
    addCustomer,
    getCustomerProfile
  };
}
