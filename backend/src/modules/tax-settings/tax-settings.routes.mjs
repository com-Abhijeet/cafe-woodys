import { Router } from 'express';
import { taxSettingsController } from './tax-settings.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();

router.get('/tax-settings', taxSettingsController.getSettings);
router.put('/tax-settings', requireAuth, requireRole(['ADMIN']), taxSettingsController.updateSettings);

export default router;
