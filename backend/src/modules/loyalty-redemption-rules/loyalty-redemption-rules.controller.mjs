import { loyaltyRedemptionRulesService } from './loyalty-redemption-rules.service.mjs';

export const loyaltyRedemptionRulesController = {
  async getAllRules(req, res, next) {
    try {
      const rules = await loyaltyRedemptionRulesService.getAllRules();
      res.json({ data: rules });
    } catch (error) {
      next(error);
    }
  },

  async createRule(req, res, next) {
    try {
      const rule = await loyaltyRedemptionRulesService.createRule(req.body);
      res.status(201).json({ data: rule });
    } catch (error) {
      next(error);
    }
  },

  async updateRule(req, res, next) {
    try {
      const rule = await loyaltyRedemptionRulesService.updateRule(req.params.id, req.body);
      res.json({ data: rule });
    } catch (error) {
      next(error);
    }
  },

  async deleteRule(req, res, next) {
    try {
      await loyaltyRedemptionRulesService.deleteRule(req.params.id);
      res.json({ message: 'Redemption rule deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
