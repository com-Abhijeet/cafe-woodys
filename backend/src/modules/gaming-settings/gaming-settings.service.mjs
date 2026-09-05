import { gamingSettingsRepository } from './gaming-settings.repository.mjs';

export const gamingSettingsService = {
  async getSettings() {
    return gamingSettingsRepository.getSettings();
  },

  async updateSettings(data) {
    return gamingSettingsRepository.updateSettings(data);
  }
};
