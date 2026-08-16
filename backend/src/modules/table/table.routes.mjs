import { Router } from 'express';
import { tableController } from './table.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();

router.use(requireAuth);

router.get('/', tableController.listTables);
router.get('/:id', tableController.getTableById);

router.post('/', requireRole('ADMIN'), tableController.createTable);
router.patch('/:id', tableController.updateTable);
router.delete('/:id', requireRole('ADMIN'), tableController.deleteTable);

export default router;
