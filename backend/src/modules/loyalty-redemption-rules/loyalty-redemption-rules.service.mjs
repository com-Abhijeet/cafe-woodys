import { loyaltyRedemptionRulesRepository } from './loyalty-redemption-rules.repository.mjs';

export const loyaltyRedemptionRulesService = {
  async getAllRules() {
    return loyaltyRedemptionRulesRepository.findAll();
  },

  async getRuleById(id) {
    const rule = await loyaltyRedemptionRulesRepository.findById(id);
    if (!rule) {
      const err = new Error('Redemption rule not found');
      err.statusCode = 404;
      throw err;
    }
    return rule;
  },

  async createRule(data) {
    if (!data.pointsRequired || Number(data.pointsRequired) <= 0) {
      const err = new Error('pointsRequired must be greater than 0');
      err.statusCode = 400;
      throw err;
    }

    if (!['PERCENTAGE', 'FLAT'].includes(data.discountType)) {
      const err = new Error('discountType must be PERCENTAGE or FLAT');
      err.statusCode = 400;
      throw err;
    }

    if (!data.discountValue || Number(data.discountValue) <= 0) {
      const err = new Error('discountValue must be greater than 0');
      err.statusCode = 400;
      throw err;
    }

    if (data.discountType === 'PERCENTAGE' && Number(data.discountValue) > 100) {
      const err = new Error('Percentage discount cannot exceed 100%');
      err.statusCode = 400;
      throw err;
    }

    return loyaltyRedemptionRulesRepository.create(data);
  },

  async updateRule(id, data) {
    await this.getRuleById(id);

    if (data.pointsRequired !== undefined && Number(data.pointsRequired) <= 0) {
      const err = new Error('pointsRequired must be greater than 0');
      err.statusCode = 400;
      throw err;
    }

    if (data.discountType !== undefined && !['PERCENTAGE', 'FLAT'].includes(data.discountType)) {
      const err = new Error('discountType must be PERCENTAGE or FLAT');
      err.statusCode = 400;
      throw err;
    }

    if (data.discountValue !== undefined && Number(data.discountValue) <= 0) {
      const err = new Error('discountValue must be greater than 0');
      err.statusCode = 400;
      throw err;
    }

    return loyaltyRedemptionRulesRepository.update(id, data);
  },

  async deleteRule(id) {
    await this.getRuleById(id);
    return loyaltyRedemptionRulesRepository.delete(id);
  },
};
