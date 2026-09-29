import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWebSocketContext } from './WebSocketContext';
import { apiClient } from '../lib/apiClient';

const SettingsContext = createContext(null);

const SETTINGS_CACHE_KEY = 'cafe_woodys_settings_cache';

function getInitialSettingsCache() {
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (e) {
    return null;
  }
}

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const { subscribe } = useWebSocketContext();

  const initialCache = getInitialSettingsCache();

  const [settings, setSettings] = useState(initialCache || {
    businessProfile: null,
    taxSettings: null,
    paymentSettings: null,
    orderSettings: null,
    gamingSettings: null,
    printerConfigs: [],
    kitchenPrintSettings: null,
    loyaltySettings: null
  });

  const [isLoading, setIsLoading] = useState(!initialCache);
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

      setSettings((prev) => {
        const newSettings = {
          businessProfile: businessProfile || prev.businessProfile,
          taxSettings: taxSettings || prev.taxSettings,
          paymentSettings: paymentSettings || prev.paymentSettings,
          orderSettings: orderSettings || prev.orderSettings,
          gamingSettings: gamingSettings || prev.gamingSettings,
          printerConfigs: Array.isArray(printerConfigs) ? printerConfigs : prev.printerConfigs,
          kitchenPrintSettings: kitchenPrintSettings || prev.kitchenPrintSettings,
          loyaltySettings: loyaltySettings || prev.loyaltySettings
        };
        try {
          localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(newSettings));
        } catch (e) {
          console.warn('Failed to save settings to localStorage:', e);
        }
        return newSettings;
      });

      setLastRefetched(new Date());
    } catch (err) {
      console.error('Failed to fetch settings in SettingsContext:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchAllSettings();
    }
  }, [user, fetchAllSettings]);

  // Real-time WebSocket listener for SETTINGS_UPDATED & PRINTERS_UPDATED
  useEffect(() => {
    if (!user || !subscribe) return;

    const unsubSettings = subscribe('SETTINGS_UPDATED', (payload) => {
      console.log('📡 Real-time settings update received via WebSocket:', payload);
      fetchAllSettings(true);
    });

    const unsubPrinters = subscribe('PRINTERS_UPDATED', (payload) => {
      console.log('📡 Real-time printers update received via WebSocket:', payload);
      fetchAllSettings(true);
    });

    return () => {
      if (unsubSettings) unsubSettings();
      if (unsubPrinters) unsubPrinters();
    };
  }, [user, subscribe, fetchAllSettings]);

  const updateSettingModule = useCallback((moduleName, data) => {
    setSettings((prev) => {
      const updated = { ...prev, [moduleName]: data };
      try {
        localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const getPrinterByPurpose = useCallback((purpose = 'BILLING') => {
    const printers = settings.printerConfigs || [];
    let target = printers.find((p) => p.purpose === purpose && p.isEnabled && p.isDefault) ||
                 printers.find((p) => p.purpose === purpose && p.isEnabled);

    if (!target && purpose === 'KITCHEN') {
      target = printers.find((p) => p.purpose === 'BILLING' && p.isEnabled && p.isDefault) ||
               printers.find((p) => p.purpose === 'BILLING' && p.isEnabled);
    }
    return target || null;
  }, [settings.printerConfigs]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        businessProfile: settings.businessProfile,
        taxSettings: settings.taxSettings,
        paymentSettings: settings.paymentSettings,
        orderSettings: settings.orderSettings,
        gamingSettings: settings.gamingSettings,
        printerConfigs: settings.printerConfigs,
        kitchenPrintSettings: settings.kitchenPrintSettings,
        loyaltySettings: settings.loyaltySettings,
        getPrinterByPurpose,
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
