import { Router } from 'express';
import { loyaltySettingsController } from './loyalty-settings.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();

router.get('/loyalty-settings', loyaltySettingsController.getSettings);
router.put('/loyalty-settings', requireAuth, requireRole(['ADMIN']), loyaltySettingsController.updateSettings);

export default router;
