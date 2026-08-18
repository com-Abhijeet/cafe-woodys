import { Router } from 'express';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';
import { getBusinessProfileHandler, updateBusinessProfileHandler } from './business-profile.controller.mjs';

const router = Router();

router.get('/business-profile', requireAuth, getBusinessProfileHandler);
router.patch('/business-profile', requireAuth, requireRole(['ADMIN']), updateBusinessProfileHandler);

export default router;
