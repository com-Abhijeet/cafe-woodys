import { kitchenPrintSettingsRepository } from './kitchen-print-settings.repository.mjs';

export const kitchenPrintSettingsService = {
  async getSettings() {
    return kitchenPrintSettingsRepository.getSettings();
  },

  async updateSettings(data) {
    return kitchenPrintSettingsRepository.updateSettings(data);
  }
};
