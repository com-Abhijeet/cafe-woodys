import { Router } from 'express';
import { paymentController } from './payment.controller.mjs';
import { requireAuth } from '../auth/auth.middleware.mjs';

const router = Router();

router.use(requireAuth);

router.get('/payments', paymentController.listPayments);

export default router;
