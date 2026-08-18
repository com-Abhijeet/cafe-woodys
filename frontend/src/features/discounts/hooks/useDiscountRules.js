import { useState, useEffect, useCallback } from 'react';
import {
  fetchDiscountRulesApi,
  createDiscountRuleApi,
  updateDiscountRuleApi,
  deleteDiscountRuleApi
} from '../api/discountRule.api';

export function useDiscountRules() {
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDiscountRulesApi();
      setRules(data);
    } catch (err) {
      setError(err.message || 'Failed to load discount rules');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const addRule = async (payload) => {
    const created = await createDiscountRuleApi(payload);
    setRules((prev) => [created, ...prev]);
    return created;
  };

  const editRule = async (id, payload) => {
    const updated = await updateDiscountRuleApi(id, payload);
    setRules((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  };

  const removeRule = async (id) => {
    await deleteDiscountRuleApi(id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  return {
    rules,
    isLoading,
    error,
    refreshRules: loadRules,
    addRule,
    editRule,
    removeRule
  };
}
