import { Router } from 'express';
import { loyaltyRedemptionRulesController } from './loyalty-redemption-rules.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();

router.get('/loyalty-redemption-rules', loyaltyRedemptionRulesController.getAllRules);
router.post('/loyalty-redemption-rules', requireAuth, requireRole(['ADMIN']), loyaltyRedemptionRulesController.createRule);
router.patch('/loyalty-redemption-rules/:id', requireAuth, requireRole(['ADMIN']), loyaltyRedemptionRulesController.updateRule);
router.delete('/loyalty-redemption-rules/:id', requireAuth, requireRole(['ADMIN']), loyaltyRedemptionRulesController.deleteRule);

export default router;
