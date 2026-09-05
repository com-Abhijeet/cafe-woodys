import { loyaltySettingsService } from './loyalty-settings.service.mjs';

export const loyaltySettingsController = {
  async getSettings(req, res, next) {
    try {
      const settings = await loyaltySettingsService.getSettings();
      res.json({ data: settings });
    } catch (error) {
      next(error);
    }
  },

  async updateSettings(req, res, next) {
    try {
      const settings = await loyaltySettingsService.updateSettings(req.body);
      res.json({ data: settings });
    } catch (error) {
      next(error);
    }
  },
};
