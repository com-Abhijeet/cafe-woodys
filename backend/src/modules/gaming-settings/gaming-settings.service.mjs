import { gamingSettingsRepository } from './gaming-settings.repository.mjs';
import { broadcastSettingsUpdated } from '../../realtime/broadcast.mjs';

export const gamingSettingsService = {
  async getSettings() {
    return gamingSettingsRepository.getSettings();
  },

  async updateSettings(data) {
    const updated = await gamingSettingsRepository.updateSettings(data);
    broadcastSettingsUpdated('GAMING', updated);
    return updated;
  }
};
