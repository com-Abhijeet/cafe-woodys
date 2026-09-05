import { Router } from 'express';
import { gamingSettingsController } from './gaming-settings.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();

router.get('/gaming-settings', gamingSettingsController.getSettings);
router.put('/gaming-settings', requireAuth, requireRole(['ADMIN']), gamingSettingsController.updateSettings);

export default router;
