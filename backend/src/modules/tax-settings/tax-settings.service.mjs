import { taxSettingsRepository } from './tax-settings.repository.mjs';
import { broadcastSettingsUpdated } from '../../realtime/broadcast.mjs';
import { settingsCache } from '../../shared/utils/settings-cache.mjs';

const CACHE_KEY = 'TAX_SETTINGS';

export const taxSettingsService = {
  async getSettings() {
    return settingsCache.getOrFetch(CACHE_KEY, () => taxSettingsRepository.getSettings());
  },

  async updateSettings(data) {
    const updated = await taxSettingsRepository.updateSettings(data);
    settingsCache.set(CACHE_KEY, updated);
    broadcastSettingsUpdated('TAX', updated);
    return updated;
  }
};
