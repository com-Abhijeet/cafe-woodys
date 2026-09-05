import { loyaltySettingsRepository } from './loyalty-settings.repository.mjs';

export const loyaltySettingsService = {
  async getSettings() {
    return loyaltySettingsRepository.getSettings();
  },

  async updateSettings(data) {
    if (data.pointsEarnedPerUnit !== undefined) {
      const val = Number(data.pointsEarnedPerUnit);
      if (isNaN(val) || val < 1) {
        const err = new Error('pointsEarnedPerUnit must be an integer >= 1');
        err.statusCode = 400;
        throw err;
      }
    }

    if (data.spendUnitInRupees !== undefined) {
      const val = Number(data.spendUnitInRupees);
      if (isNaN(val) || val < 1) {
        const err = new Error('spendUnitInRupees must be an integer >= 1');
        err.statusCode = 400;
        throw err;
      }
    }

    if (data.maxRedemptionPercentOfBill !== undefined && data.maxRedemptionPercentOfBill !== null && data.maxRedemptionPercentOfBill !== '') {
      const val = Number(data.maxRedemptionPercentOfBill);
      if (isNaN(val) || val < 0 || val > 100) {
        const err = new Error('maxRedemptionPercentOfBill must be between 0 and 100 or null');
        err.statusCode = 400;
        throw err;
      }
    }

    return loyaltySettingsRepository.updateSettings(data);
  },
};
