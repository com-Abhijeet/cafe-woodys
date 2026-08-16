import { Router } from 'express';
import { inventoryController } from './inventory.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();

router.use(requireAuth);

router.get('/', inventoryController.listInventoryItems);
router.get('/:id', inventoryController.getInventoryItemById);
router.post('/', requireRole('ADMIN'), inventoryController.createInventoryItem);
router.patch('/:id', requireRole('ADMIN'), inventoryController.updateInventoryItem);
router.delete('/:id', requireRole('ADMIN'), inventoryController.deleteInventoryItem);

// Stock Adjustments
router.post('/:id/adjustments', inventoryController.recordAdjustment);
router.get('/:id/adjustments', inventoryController.getItemAdjustments);

export default router;
