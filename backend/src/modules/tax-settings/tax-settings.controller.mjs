import { taxSettingsService } from './tax-settings.service.mjs';

export const taxSettingsController = {
  async getSettings(req, res, next) {
    try {
      const settings = await taxSettingsService.getSettings();
      return res.json({ data: settings });
    } catch (err) {
      next(err);
    }
  },

  async updateSettings(req, res, next) {
    try {
      const updated = await taxSettingsService.updateSettings(req.body);
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
};
