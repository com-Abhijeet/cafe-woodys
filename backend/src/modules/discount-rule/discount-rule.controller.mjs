import { discountRuleService } from './discount-rule.service.mjs';

export async function listDiscountRulesHandler(req, res, next) {
  try {
    const rules = await discountRuleService.listRules();
    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
}

export async function createDiscountRuleHandler(req, res, next) {
  try {
    const created = await discountRuleService.createRule(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}

export async function updateDiscountRuleHandler(req, res, next) {
  try {
    const updated = await discountRuleService.updateRule(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteDiscountRuleHandler(req, res, next) {
  try {
    await discountRuleService.deleteRule(req.params.id);
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
}
