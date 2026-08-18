import { discountRuleRepository } from './discount-rule.repository.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';

function formatRule(rule) {
  if (!rule) return null;
  return {
    ...rule,
    value: Number(rule.value)
  };
}

export const discountRuleService = {
  async listRules() {
    const rules = await discountRuleRepository.findAll();
    return rules.map(formatRule);
  },

  async getRuleById(id) {
    const rule = await discountRuleRepository.findById(id);
    if (!rule) {
      throw new NotFoundError('Discount rule not found', 'DISCOUNT_RULE_NOT_FOUND');
    }
    return formatRule(rule);
  },

  async createRule(data) {
    if (!data.name) {
      throw new ValidationError('Rule name is required', 'NAME_REQUIRED');
    }
    const rule = await discountRuleRepository.create({
      name: data.name,
      type: data.type || 'PERCENTAGE',
      value: parseInt(data.value, 10) || 0,
      scope: data.scope || 'ALL',
      zoneId: data.scope === 'ZONE' ? data.zoneId || null : null,
      daysOfWeek: Array.isArray(data.daysOfWeek) ? data.daysOfWeek : [],
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
    });
    return formatRule(rule);
  },

  async updateRule(id, data) {
    const existing = await discountRuleRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Discount rule not found', 'DISCOUNT_RULE_NOT_FOUND');
    }

    const payload = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.type !== undefined) payload.type = data.type;
    if (data.value !== undefined) payload.value = parseInt(data.value, 10);
    if (data.scope !== undefined) payload.scope = data.scope;
    if (data.scope === 'ZONE') payload.zoneId = data.zoneId || null;
    if (data.scope !== undefined && data.scope !== 'ZONE') payload.zoneId = null;
    if (data.daysOfWeek !== undefined) payload.daysOfWeek = data.daysOfWeek;
    if (data.startTime !== undefined) payload.startTime = data.startTime || null;
    if (data.endTime !== undefined) payload.endTime = data.endTime || null;
    if (data.isActive !== undefined) payload.isActive = Boolean(data.isActive);

    const updated = await discountRuleRepository.update(id, payload);
    return formatRule(updated);
  },

  async deleteRule(id) {
    const existing = await discountRuleRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Discount rule not found', 'DISCOUNT_RULE_NOT_FOUND');
    }
    return discountRuleRepository.delete(id);
  }
};
