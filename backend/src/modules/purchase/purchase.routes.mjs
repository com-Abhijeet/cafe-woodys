import { Router } from 'express';
import { purchaseController } from './purchase.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();

router.use(requireAuth);

router.get('/purchase-payments', purchaseController.listPurchasePayments);
router.get('/purchase-orders', purchaseController.listPurchaseOrders);
router.get('/purchase-orders/:id', purchaseController.getPurchaseOrderById);
router.post('/purchase-orders', requireRole('ADMIN'), purchaseController.createPurchaseOrder);
router.post('/purchase-orders/:id/payments', requireRole('ADMIN'), purchaseController.addPayment);

export default router;
