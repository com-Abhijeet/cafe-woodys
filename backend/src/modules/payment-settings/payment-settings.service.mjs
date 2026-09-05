import { paymentSettingsRepository } from './payment-settings.repository.mjs';

export const paymentSettingsService = {
  async getSettings() {
    return paymentSettingsRepository.getSettings();
  },

  async updateSettings(data) {
    return paymentSettingsRepository.updateSettings(data);
  }
};
