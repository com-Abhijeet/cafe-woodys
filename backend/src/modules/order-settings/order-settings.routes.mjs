import { Router } from 'express';
import { orderSettingsController } from './order-settings.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();

router.get('/order-settings', orderSettingsController.getSettings);
router.put('/order-settings', requireAuth, requireRole(['ADMIN']), orderSettingsController.updateSettings);

export default router;
