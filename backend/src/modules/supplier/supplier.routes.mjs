import { Router } from 'express';
import { supplierController } from './supplier.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();

router.use(requireAuth);

router.get('/', supplierController.listSuppliers);
router.get('/balances', supplierController.getSupplierBalances);
router.get('/:id', supplierController.getSupplierById);
router.get('/:id/ledger', supplierController.getSupplierLedger);
router.get('/:id/ledger/export', supplierController.exportSupplierLedgerCsv);
router.post('/', requireRole('ADMIN'), supplierController.createSupplier);
router.patch('/:id', requireRole('ADMIN'), supplierController.updateSupplier);
router.delete('/:id', requireRole('ADMIN'), supplierController.deleteSupplier);

export default router;
