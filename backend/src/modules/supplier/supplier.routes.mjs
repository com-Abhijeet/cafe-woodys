import { Router } from 'express';
import { supplierController } from './supplier.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();

router.use(requireAuth);

router.get('/', supplierController.listSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.post('/', requireRole('ADMIN'), supplierController.createSupplier);
router.patch('/:id', requireRole('ADMIN'), supplierController.updateSupplier);
router.delete('/:id', requireRole('ADMIN'), supplierController.deleteSupplier);

export default router;
