import { useState, useEffect, useCallback } from 'react';
import { listZonesApi, createZoneApi, updateZoneApi, deleteZoneApi } from '../api/zones.api';

export function useZones() {
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchZones = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await listZonesApi();
      setZones(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const addZone = async (zoneData) => {
    const newZone = await createZoneApi(zoneData);
    await fetchZones();
    return newZone;
  };

  const editZone = async (id, zoneData) => {
    const updated = await updateZoneApi(id, zoneData);
    await fetchZones();
    return updated;
  };

  const removeZone = async (id) => {
    await deleteZoneApi(id);
    await fetchZones();
  };

  return {
    zones,
    isLoading,
    error,
    refreshZones: fetchZones,
    addZone,
    editZone,
    removeZone
  };
}
