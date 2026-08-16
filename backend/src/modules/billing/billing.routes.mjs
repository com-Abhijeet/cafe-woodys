import { Router } from 'express';
import { billingController } from './billing.controller.mjs';
import { requireAuth } from '../auth/auth.middleware.mjs';

const router = Router();

router.use(requireAuth);

router.post('/tables/:tableId/bill', billingController.generateBill);
router.post('/bills/:billId/payments', billingController.addPayment);
router.patch('/bills/:id/customer', billingController.updateBillCustomer);
router.get('/bills/:id', billingController.getBillById);
router.get('/bills', billingController.listBills);

export default router;
