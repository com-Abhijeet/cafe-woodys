import { Router } from 'express';
import { orderController } from './order.controller.mjs';
import { requireAuth, requireRole } from '../auth/auth.middleware.mjs';

const router = Router();

router.use(requireAuth);

// Board & Status routes
router.get('/orders', orderController.listOrders);
router.post('/orders', orderController.createOrder);
router.post('/orders/close-day', requireRole(['ADMIN']), orderController.closeDay);
router.patch('/orders/:id/kitchen-status', orderController.updateKitchenStatus);
router.patch('/orders/:id/cancel', orderController.cancelOrder);

// Phase 19 Step 1: Item-level line item voiding (gated to WAITER, COUNTER, ADMIN)
router.patch('/order-items/:id/void', requireRole(['WAITER', 'COUNTER', 'ADMIN']), orderController.voidOrderItem);
router.patch('/orders/items/:id/void', requireRole(['WAITER', 'COUNTER', 'ADMIN']), orderController.voidOrderItem);

// Table-specific order routes
router.get('/tables/:tableId/orders', orderController.getTableOrders);
router.post('/tables/:tableId/orders', orderController.createTableOrder);

export default router;
