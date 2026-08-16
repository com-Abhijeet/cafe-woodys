import { Router } from 'express';
import { authController } from './auth.controller.mjs';
import { requireAuth, requireRole } from './auth.middleware.mjs';

const router = Router();

// Public routes
router.post('/login', authController.login);

// Protected routes
router.get('/me', requireAuth, authController.me);

// Admin-only staff management
router.post('/staff', requireAuth, requireRole('ADMIN'), authController.createStaff);
router.get('/staff', requireAuth, requireRole('ADMIN'), authController.listStaff);
router.patch('/staff/:id', requireAuth, requireRole('ADMIN'), authController.updateStaff);
router.patch('/staff/:id/status', requireAuth, requireRole('ADMIN'), authController.toggleStaffStatus);
router.patch('/staff/:id/reset-password', requireAuth, requireRole('ADMIN'), authController.resetPassword);

export default router;
