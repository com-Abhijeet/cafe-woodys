import { Router } from 'express';
import { daybookController } from './daybook.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();

router.use(requireAuth);

router.get('/daybook', daybookController.getDaybook);
router.get('/daybook/export', daybookController.exportDaybookCsv);
router.get('/daybook/settings', daybookController.getSettings);
router.put('/daybook/settings', requireRole(['ADMIN']), daybookController.updateSettings);

router.post('/cash-transactions', requireRole(['ADMIN', 'COUNTER']), daybookController.addCashTransaction);

export default router;
