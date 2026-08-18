import { Router } from 'express';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';
import {
  listDiscountRulesHandler,
  createDiscountRuleHandler,
  updateDiscountRuleHandler,
  deleteDiscountRuleHandler
} from './discount-rule.controller.mjs';

const router = Router();

router.use(requireAuth);

router.get('/discount-rules', listDiscountRulesHandler);
router.post('/discount-rules', requireRole(['ADMIN']), createDiscountRuleHandler);
router.patch('/discount-rules/:id', requireRole(['ADMIN']), updateDiscountRuleHandler);
router.delete('/discount-rules/:id', requireRole(['ADMIN']), deleteDiscountRuleHandler);

export default router;
