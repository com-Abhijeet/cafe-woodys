import { useState, useEffect, useCallback } from 'react';
import { fetchBusinessProfileApi, updateBusinessProfileApi } from '../api/businessProfile.api';

export function useBusinessProfile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchBusinessProfileApi();
      setProfile(data);
    } catch (err) {
      setError(err.message || 'Failed to load business profile settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = async (payload) => {
    setError(null);
    try {
      const updated = await updateBusinessProfileApi(payload);
      setProfile(updated);
      return updated;
    } catch (err) {
      setError(err.message || 'Failed to update business profile');
      throw err;
    }
  };

  return {
    profile,
    isLoading,
    error,
    refreshProfile: loadProfile,
    updateProfile
  };
}
