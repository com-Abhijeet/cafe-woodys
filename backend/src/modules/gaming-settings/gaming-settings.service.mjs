import { gamingSettingsRepository } from './gaming-settings.repository.mjs';
import { broadcastSettingsUpdated } from '../../realtime/broadcast.mjs';
import { settingsCache } from '../../shared/utils/settings-cache.mjs';

const CACHE_KEY = 'GAMING_SETTINGS';

export const gamingSettingsService = {
  async getSettings() {
    return settingsCache.getOrFetch(CACHE_KEY, () => gamingSettingsRepository.getSettings());
  },

  async updateSettings(data) {
    const updated = await gamingSettingsRepository.updateSettings(data);
    settingsCache.set(CACHE_KEY, updated);
    broadcastSettingsUpdated('GAMING', updated);
    return updated;
  }
};
