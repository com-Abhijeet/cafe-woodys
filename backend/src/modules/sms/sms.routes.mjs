import { Router } from 'express';
import { smsController } from './sms.controller.mjs';
import { requireAuth } from '../auth/auth.middleware.mjs';

const router = Router();

router.use(requireAuth);

router.get('/customers/:customerId/sms-logs', smsController.getCustomerSmsLogs);

export default router;
