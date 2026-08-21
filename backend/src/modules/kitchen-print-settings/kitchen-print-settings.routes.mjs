import { Router } from 'express';
import { kitchenPrintSettingsController } from './kitchen-print-settings.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();

router.use(requireAuth);

router.get('/kitchen-print-settings', kitchenPrintSettingsController.getSettings);
router.patch('/kitchen-print-settings', requireRole(['ADMIN']), kitchenPrintSettingsController.updateSettings);

export default router;
