import { paymentSettingsService } from './payment-settings.service.mjs';

export const paymentSettingsController = {
  async getSettings(req, res, next) {
    try {
      const settings = await paymentSettingsService.getSettings();
      return res.json({ data: settings });
    } catch (err) {
      next(err);
    }
  },

  async updateSettings(req, res, next) {
    try {
      const updated = await paymentSettingsService.updateSettings(req.body);
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
};
