import { paymentSettingsRepository } from './payment-settings.repository.mjs';
import { broadcastSettingsUpdated } from '../../realtime/broadcast.mjs';

export const paymentSettingsService = {
  async getSettings() {
    return paymentSettingsRepository.getSettings();
  },

  async updateSettings(data) {
    const updated = await paymentSettingsRepository.updateSettings(data);
    broadcastSettingsUpdated('PAYMENT', updated);
    return updated;
  }
};
