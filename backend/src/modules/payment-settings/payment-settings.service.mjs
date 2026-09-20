import { paymentSettingsRepository } from './payment-settings.repository.mjs';
import { broadcastSettingsUpdated } from '../../realtime/broadcast.mjs';
import { settingsCache } from '../../shared/utils/settings-cache.mjs';

const CACHE_KEY = 'PAYMENT_SETTINGS';

export const paymentSettingsService = {
  async getSettings() {
    return settingsCache.getOrFetch(CACHE_KEY, () => paymentSettingsRepository.getSettings());
  },

  async updateSettings(data) {
    const updated = await paymentSettingsRepository.updateSettings(data);
    settingsCache.set(CACHE_KEY, updated);
    broadcastSettingsUpdated('PAYMENT', updated);
    return updated;
  }
};
