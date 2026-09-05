import { gamingSettingsService } from './gaming-settings.service.mjs';

export const gamingSettingsController = {
  async getSettings(req, res, next) {
    try {
      const settings = await gamingSettingsService.getSettings();
      return res.json({ data: settings });
    } catch (err) {
      next(err);
    }
  },

  async updateSettings(req, res, next) {
    try {
      const updated = await gamingSettingsService.updateSettings(req.body);
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
};
