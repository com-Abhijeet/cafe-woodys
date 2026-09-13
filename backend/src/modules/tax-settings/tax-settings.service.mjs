import { taxSettingsRepository } from './tax-settings.repository.mjs';
import { broadcastSettingsUpdated } from '../../realtime/broadcast.mjs';

export const taxSettingsService = {
  async getSettings() {
    return taxSettingsRepository.getSettings();
  },

  async updateSettings(data) {
    const updated = await taxSettingsRepository.updateSettings(data);
    broadcastSettingsUpdated('TAX', updated);
    return updated;
  }
};
