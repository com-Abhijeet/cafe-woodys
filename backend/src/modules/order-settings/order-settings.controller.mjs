import { orderSettingsService } from './order-settings.service.mjs';

export const orderSettingsController = {
  async getSettings(req, res, next) {
    try {
      const settings = await orderSettingsService.getSettings();
      return res.json({ data: settings });
    } catch (err) {
      next(err);
    }
  },

  async updateSettings(req, res, next) {
    try {
      const updated = await orderSettingsService.updateSettings(req.body);
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
};
