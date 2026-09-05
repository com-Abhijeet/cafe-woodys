import { Router } from 'express';
import { paymentSettingsController } from './payment-settings.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();

router.get('/payment-settings', paymentSettingsController.getSettings);
router.put('/payment-settings', requireAuth, requireRole(['ADMIN']), paymentSettingsController.updateSettings);

export default router;
