import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWebSocketContext } from './WebSocketContext';
import { apiClient } from '../lib/apiClient';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const { subscribe } = useWebSocketContext();

  const [settings, setSettings] = useState({
    businessProfile: null,
    taxSettings: null,
    paymentSettings: null,
    orderSettings: null,
    gamingSettings: null,
    printerConfigs: [],
    kitchenPrintSettings: null,
    loyaltySettings: null
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefetched, setLastRefetched] = useState(null);

  const fetchAllSettings = useCallback(async (isBackground = false) => {
    if (!user) return;
    if (!isBackground) setIsLoading(true);
    setIsRefreshing(true);

    try {
      const [
        businessProfile,
        taxSettings,
        paymentSettings,
        orderSettings,
        gamingSettings,
        printerConfigs,
        kitchenPrintSettings,
        loyaltySettings
      ] = await Promise.all([
        apiClient('/business-profile').catch(() => null),
        apiClient('/tax-settings').catch(() => null),
        apiClient('/payment-settings').catch(() => null),
        apiClient('/order-settings').catch(() => null),
        apiClient('/gaming-settings').catch(() => null),
        apiClient('/printer-configs').catch(() => []),
        apiClient('/kitchen-print-settings').catch(() => null),
        apiClient('/loyalty-settings').catch(() => null)
      ]);

      setSettings({
        businessProfile,
        taxSettings,
        paymentSettings,
        orderSettings,
        gamingSettings,
        printerConfigs: Array.isArray(printerConfigs) ? printerConfigs : [],
        kitchenPrintSettings,
        loyaltySettings
      });
      setLastRefetched(new Date());
    } catch (err) {
      console.error('Failed to fetch settings in SettingsContext:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAllSettings();
    }
  }, [user, fetchAllSettings]);

  // Real-time WebSocket listener for SETTINGS_UPDATED
  useEffect(() => {
    if (!user || !subscribe) return;

    const unsub = subscribe('SETTINGS_UPDATED', (payload) => {
      console.log('📡 Real-time settings update received via WebSocket:', payload);
      fetchAllSettings(true);
    });

    return () => {
      if (unsub) unsub();
    };
  }, [user, subscribe, fetchAllSettings]);

  const updateSettingModule = useCallback((moduleName, data) => {
    setSettings((prev) => ({
      ...prev,
      [moduleName]: data
    }));
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        isRefreshing,
        lastRefetched,
        refreshSettings: fetchAllSettings,
        updateSettingModule
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
}
