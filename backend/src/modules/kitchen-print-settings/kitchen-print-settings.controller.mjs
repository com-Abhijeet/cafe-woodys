import { kitchenPrintSettingsService } from './kitchen-print-settings.service.mjs';

export const kitchenPrintSettingsController = {
  async getSettings(req, res, next) {
    try {
      const settings = await kitchenPrintSettingsService.getSettings();
      return res.json({ data: settings });
    } catch (err) {
      next(err);
    }
  },

  async updateSettings(req, res, next) {
    try {
      const updated = await kitchenPrintSettingsService.updateSettings(req.body);
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
};
