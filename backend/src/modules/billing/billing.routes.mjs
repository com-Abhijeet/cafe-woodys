import { Router } from 'express';
import { billingController } from './billing.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();

router.use(requireAuth);

router.get('/tables/:tableId/discount-preview', billingController.previewDiscount);
router.get('/tables/:tableId/bill-preview', billingController.getBillPreview);
router.get('/tables/:tableId/kitchen-check', billingController.checkKitchenStatus);
router.post('/tables/:tableId/bill', billingController.generateBill);
router.get('/bills', billingController.listBills);
router.post('/bills/bulk-settle', requireRole(['ADMIN']), billingController.bulkSettleBills);
router.post('/bills/:billId/payments', billingController.addPayment);
router.patch('/bills/:id/customer', billingController.updateBillCustomer);
router.post('/bills/:id/void', requireRole(['ADMIN']), billingController.voidBill);
router.get('/bills/:id', billingController.getBillById);

export default router;
