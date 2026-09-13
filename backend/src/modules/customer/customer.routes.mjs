import { Router } from 'express';
import { customerController } from './customer.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();

router.use(requireAuth);

router.get('/', customerController.searchCustomers);
router.get('/balances', customerController.getCustomerBalances);
router.post('/', customerController.createCustomer);
router.get('/:id', customerController.getCustomerById);
router.get('/:id/ledger', customerController.getCustomerLedger);
router.get('/:id/ledger/export', customerController.exportCustomerLedgerCsv);
router.patch('/:id', customerController.updateCustomer);
router.get('/:id/loyalty', customerController.getLoyalty);
router.post('/:id/loyalty/adjust', requireRole(['ADMIN']), customerController.adjustLoyaltyPoints);

export default router;
