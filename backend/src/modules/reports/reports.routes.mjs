import { Router } from 'express';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';
import {
  getSalesSummaryHandler,
  getTopItemsHandler,
  getZonePerformanceHandler,
  getStaffPerformanceHandler,
  getPaymentMethodsHandler
} from './reports.controller.mjs';

const router = Router();

router.get('/reports/sales-summary', requireAuth, requireRole(['ADMIN']), getSalesSummaryHandler);
router.get('/reports/top-items', requireAuth, requireRole(['ADMIN']), getTopItemsHandler);
router.get('/reports/zone-performance', requireAuth, requireRole(['ADMIN']), getZonePerformanceHandler);
router.get('/reports/staff-performance', requireAuth, requireRole(['ADMIN']), getStaffPerformanceHandler);
router.get('/reports/payment-methods', requireAuth, requireRole(['ADMIN']), getPaymentMethodsHandler);

export default router;
