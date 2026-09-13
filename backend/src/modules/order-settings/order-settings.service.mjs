import { orderSettingsRepository } from './order-settings.repository.mjs';
import { broadcastSettingsUpdated } from '../../realtime/broadcast.mjs';

export const orderSettingsService = {
  async getSettings() {
    return orderSettingsRepository.getSettings();
  },

  async updateSettings(data) {
    const updated = await orderSettingsRepository.updateSettings(data);
    broadcastSettingsUpdated('ORDER', updated);
    return updated;
  }
};
