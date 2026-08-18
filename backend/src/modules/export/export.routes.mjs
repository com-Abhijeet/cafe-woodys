import { Router } from 'express';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';
import { exportBillsCsvHandler, exportPurchasesCsvHandler } from './export.controller.mjs';

const router = Router();

router.get('/bills/export', requireAuth, requireRole(['ADMIN']), exportBillsCsvHandler);
router.get('/purchase-orders/export', requireAuth, requireRole(['ADMIN']), exportPurchasesCsvHandler);

export default router;
