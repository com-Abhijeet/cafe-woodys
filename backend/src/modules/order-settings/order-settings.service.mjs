import { orderSettingsRepository } from './order-settings.repository.mjs';

export const orderSettingsService = {
  async getSettings() {
    return orderSettingsRepository.getSettings();
  },

  async updateSettings(data) {
    return orderSettingsRepository.updateSettings(data);
  }
};
