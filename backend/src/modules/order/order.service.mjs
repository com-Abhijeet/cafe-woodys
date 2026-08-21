import { orderRepository } from './order.repository.mjs';
import { menuItemRepository } from '../menu-item/menu-item.repository.mjs';
import { tableService } from '../table/table.service.mjs';
import { tableRepository } from '../table/table.repository.mjs';
import { businessProfileService } from '../business-profile/business-profile.service.mjs';
import { broadcastOrderCreated, broadcastTableUpdate, broadcastKitchenStatusUpdated, broadcastOrderBoardCleared } from '../../realtime/broadcast.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';
import { ConflictError } from '../../shared/errors/conflict-error.mjs';
import { ForbiddenError } from '../../shared/errors/forbidden-error.mjs';

const SEQUENTIAL_KITCHEN_TRANSITIONS = {
  PENDING: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED'
};

export const orderService = {
  async getTableOrders(tableId, status = 'OPEN') {
    const table = await tableService.getTableById(tableId);
    if (!table) {
      throw new NotFoundError('Table not found', 'TABLE_NOT_FOUND');
    }

    const orders = await orderRepository.findByTableId(tableId, status);

    const foodTotal = orders.reduce((sum, order) => {
      const orderSum = (order.items || [])
        .filter((item) => !item.voidedAt)
        .reduce((iSum, item) => iSum + (item.priceSnapshot * item.quantity), 0);
      return sum + orderSum;
    }, 0);

    return {
      tableId,
      orders,
      unbilledFoodTotal: foodTotal
    };
  },

  async listOrders(filters = {}) {
    return orderRepository.findAllOrders(filters);
  },

  async getActiveUnbilledOrders({ type = 'all' } = {}) {
    const orders = await orderRepository.findActiveUnbilledOrders({ type });
    return orders.map((o) => {
      const activeItems = (o.items || []).filter((i) => !i.voidedAt);
      const foodTotal = activeItems.reduce((sum, i) => sum + i.priceSnapshot * i.quantity, 0);
      const itemCount = activeItems.reduce((sum, i) => sum + i.quantity, 0);
      const elapsedTimeMinutes = Math.max(0, Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000));

      return {
        ...o,
        foodTotal,
        itemCount,
        elapsedTimeMinutes
      };
    });
  },

  async voidOrderItem(orderItemId, staffId, { reason, ignoreKitchenStatus = false }) {
    if (!reason || !reason.trim()) {
      throw new ValidationError('A void reason is mandatory when voiding an order item', 'VOID_REASON_REQUIRED');
    }

    const updatedOrder = await orderRepository.voidOrderItemWithTransaction(orderItemId, staffId, reason, ignoreKitchenStatus);
    broadcastKitchenStatusUpdated(updatedOrder);

    return updatedOrder;
  },

  async voidAndReplaceOrderItem(orderItemId, staffId, { reason, replacement }) {
    if (!reason || !reason.trim()) {
      throw new ValidationError('A void reason is mandatory when voiding an order item', 'VOID_REASON_REQUIRED');
    }

    const updatedOrder = await orderRepository.voidAndReplaceOrderItemWithTransaction(orderItemId, staffId, { reason, replacement });
    broadcastKitchenStatusUpdated(updatedOrder);

    return updatedOrder;
  },

  async addOrderItemToOrder(orderId, { menuItemId, quantity, priceOverride }) {
    const updatedOrder = await orderRepository.addOrderItemToOrderWithTransaction(orderId, { menuItemId, quantity, priceOverride });
    broadcastKitchenStatusUpdated(updatedOrder);

    return updatedOrder;
  },

  async closeDay({ force = false } = {}) {
    const unresolved = await orderRepository.findUnresolvedBoardOrders();

    if (unresolved.length > 0 && !force) {
      return {
        canClose: false,
        unresolvedOrdersCount: unresolved.length,
        unresolvedOrders: unresolved.map((o) => ({
          orderId: o.id,
          dailyOrderNumber: o.dailyOrderNumber,
          orderType: o.orderType,
          tableName: o.table?.name || (o.orderType === 'PARCEL' ? 'Parcel' : 'Unknown'),
          itemCount: o.items?.filter((i) => !i.voidedAt).reduce((sum, i) => sum + i.quantity, 0) || 0,
          status: o.status,
          kitchenStatus: o.kitchenStatus,
          createdAt: o.createdAt
        }))
      };
    }

    const { clearedCount, timestamp } = await orderRepository.clearBoardOrders();
    broadcastOrderBoardCleared({ clearedCount, timestamp });

    try {
      const allTables = await tableRepository.findAll();
      allTables.forEach((t) => broadcastTableUpdate(t));
    } catch (tErr) {
      console.error('Error broadcasting table updates on close day:', tErr);
    }

    return {
      canClose: true,
      clearedOrdersCount: clearedCount,
      timestamp
    };
  },

  async updateKitchenStatus(id, newKitchenStatus, requestingUser) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND');
    }

    if (order.status === 'CANCELLED') {
      throw new ConflictError('Cannot update kitchen status of a cancelled order', 'ORDER_CANCELLED');
    }

    const currentStatus = order.kitchenStatus || 'PENDING';

    if (currentStatus === 'SERVED') {
      throw new ConflictError('Order has already been SERVED and completed', 'ORDER_ALREADY_SERVED');
    }

    const expectedNextStatus = SEQUENTIAL_KITCHEN_TRANSITIONS[currentStatus];

    if (newKitchenStatus !== expectedNextStatus) {
      throw new ConflictError(
        `Invalid kitchen status transition from ${currentStatus} to ${newKitchenStatus}. Next sequential status must be '${expectedNextStatus}'`,
        'INVALID_KITCHEN_TRANSITION'
      );
    }

    // Role-based permission check
    const role = requestingUser?.role;
    if (role === 'KITCHEN') {
      if (newKitchenStatus === 'SERVED') {
        throw new ForbiddenError('Kitchen staff cannot mark orders as SERVED (only Front of House can verify delivery)', 'FORBIDDEN_KITCHEN_ACTION');
      }
    } else if (role === 'WAITER' || role === 'COUNTER') {
      if (currentStatus !== 'READY' || newKitchenStatus !== 'SERVED') {
        throw new ForbiddenError('Front of House staff can only mark READY orders as SERVED', 'FORBIDDEN_FOH_ACTION');
      }
    }

    const updatedOrder = await orderRepository.updateKitchenStatus(id, newKitchenStatus);
    broadcastKitchenStatusUpdated(updatedOrder);

    return updatedOrder;
  },

  async cancelOrder(id, requestingUser) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND');
    }

    if (order.status === 'CANCELLED') {
      throw new ConflictError('Order is already cancelled', 'ALREADY_CANCELLED');
    }

    // Step 6: Admin-configurable order cancellation window in seconds
    const profile = await businessProfileService.getProfile();
    const cancellationWindowSecs = profile?.orderCancellationWindowSeconds ?? 300;

    const createdTime = new Date(order.createdAt).getTime();
    const now = new Date().getTime();
    const elapsedSecs = Math.floor((now - createdTime) / 1000);

    const isKitchenPreparing = order.kitchenStatus && order.kitchenStatus !== 'PENDING';
    const role = requestingUser?.role;

    if (isKitchenPreparing && role !== 'ADMIN' && role !== 'COUNTER') {
      throw new ConflictError('Cannot cancel order after kitchen has started preparation', 'KITCHEN_PREP_STARTED');
    }

    if (elapsedSecs > cancellationWindowSecs && role !== 'ADMIN' && role !== 'COUNTER') {
      throw new ConflictError(`Cancellation window (${Math.round(cancellationWindowSecs / 60)} minutes) expired. Please request Counter or Admin to cancel.`, 'UNDO_WINDOW_EXPIRED');
    }

    const cancelledOrder = await orderRepository.cancelOrderWithTransaction(id);
    broadcastKitchenStatusUpdated({ ...cancelledOrder, kitchenStatus: 'CANCELLED' });

    return cancelledOrder;
  },

  async createOrder(staffId, { tableId, orderType = 'DINE_IN', items, customerId }) {
    if (orderType === 'DINE_IN') {
      if (!tableId) {
        throw new ValidationError('tableId is required for DINE_IN orders', 'TABLE_REQUIRED');
      }
      const table = await tableService.getTableById(tableId);
      if (!table) {
        throw new NotFoundError('Table not found', 'TABLE_NOT_FOUND');
      }
    }

    const profile = await businessProfileService.getProfile();
    const defaultGst = profile ? profile.defaultGstPercent : 5;

    const menuItemIds = items.map((i) => i.menuItemId);
    const dbMenuItems = await menuItemRepository.findByIds(menuItemIds);
    const dbMenuMap = new Map(dbMenuItems.map((m) => [m.id, m]));

    const preparedItems = [];
    for (const item of items) {
      const menuItem = dbMenuMap.get(item.menuItemId);
      if (!menuItem) {
        throw new NotFoundError(`Menu item ID '${item.menuItemId}' not found`, 'MENU_ITEM_NOT_FOUND');
      }
      if (!menuItem.isAvailable) {
        throw new ValidationError(`Menu item '${menuItem.name}' is currently unavailable`, 'ITEM_UNAVAILABLE');
      }

      const resolvedGst = menuItem.gstPercent != null ? Number(menuItem.gstPercent) : defaultGst;

      preparedItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        priceSnapshot: menuItem.price,
        gstPercentSnapshot: resolvedGst
      });
    }

    const createdOrder = await orderRepository.createOrderWithTransaction({
      tableId: orderType === 'PARCEL' ? null : tableId,
      orderType,
      staffId,
      customerId: customerId || null,
      items: preparedItems
    });

    if (orderType === 'DINE_IN' && tableId) {
      const table = await tableService.getTableById(tableId);
      if (table && table.status === 'FREE') {
        await tableRepository.update(tableId, { status: 'OCCUPIED' });
        const updatedTable = await tableService.getTableById(tableId);
        broadcastTableUpdate(updatedTable);
      }
    }

    broadcastOrderCreated(createdOrder);
    return createdOrder;
  },

  async createTableOrder(tableId, staffId, { items, customerId }) {
    return this.createOrder(staffId, { tableId, orderType: 'DINE_IN', items, customerId });
  }
};
