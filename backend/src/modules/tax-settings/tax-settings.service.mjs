import { taxSettingsRepository } from './tax-settings.repository.mjs';

export const taxSettingsService = {
  async getSettings() {
    return taxSettingsRepository.getSettings();
  },

  async updateSettings(data) {
    return taxSettingsRepository.updateSettings(data);
  }
};
