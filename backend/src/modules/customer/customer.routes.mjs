import { Router } from 'express';
import { customerController } from './customer.controller.mjs';
import { requireAuth } from '../auth/auth.middleware.mjs';

const router = Router();

router.use(requireAuth);

router.get('/', customerController.searchCustomers);
router.post('/', customerController.createCustomer);
router.get('/:id', customerController.getCustomerById);
router.patch('/:id', customerController.updateCustomer);

export default router;
