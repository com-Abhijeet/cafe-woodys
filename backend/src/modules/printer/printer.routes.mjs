import { Router } from 'express';
import { printerController } from './printer.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();

router.use(requireAuth);

router.get('/printer-configs', printerController.listPrinters);
router.get('/printer-configs/:id', printerController.getPrinterById);

router.post('/printer-configs', requireRole(['ADMIN']), printerController.createPrinter);
router.patch('/printer-configs/:id', requireRole(['ADMIN']), printerController.updatePrinter);
router.delete('/printer-configs/:id', requireRole(['ADMIN']), printerController.deletePrinter);

export default router;
