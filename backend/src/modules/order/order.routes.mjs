import { Router } from 'express';
import { orderController } from './order.controller.mjs';
import { requireAuth } from '../auth/auth.middleware.mjs';

const router = Router();

router.use(requireAuth);

// Board & Status routes
router.get('/orders', orderController.listOrders);
router.patch('/orders/:id/kitchen-status', orderController.updateKitchenStatus);
router.patch('/orders/:id/cancel', orderController.cancelOrder);

// Table-specific order routes
router.get('/tables/:tableId/orders', orderController.getTableOrders);
router.post('/tables/:tableId/orders', orderController.createTableOrder);

export default router;
