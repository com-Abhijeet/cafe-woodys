import { orderSettingsRepository } from './order-settings.repository.mjs';
import { broadcastSettingsUpdated } from '../../realtime/broadcast.mjs';
import { settingsCache } from '../../shared/utils/settings-cache.mjs';

const CACHE_KEY = 'ORDER_SETTINGS';

export const orderSettingsService = {
  async getSettings() {
    return settingsCache.getOrFetch(CACHE_KEY, () => orderSettingsRepository.getSettings());
  },

  async updateSettings(data) {
    const updated = await orderSettingsRepository.updateSettings(data);
    settingsCache.set(CACHE_KEY, updated);
    broadcastSettingsUpdated('ORDER', updated);
    return updated;
  }
};
