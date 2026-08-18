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
      const orderSum = order.items.reduce((iSum, item) => iSum + (item.priceSnapshot * item.quantity), 0);
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

  async closeDay({ force = false } = {}) {
    const unresolved = await orderRepository.findUnresolvedBoardOrders();

    if (unresolved.length > 0 && !force) {
      return {
        canClose: false,
        unresolvedOrdersCount: unresolved.length,
        unresolvedOrders: unresolved.map((o) => ({
          orderId: o.id,
          tableName: o.table?.name || 'Unknown Table',
          itemCount: o.items?.reduce((sum, i) => sum + i.quantity, 0) || 0,
          status: o.status,
          kitchenStatus: o.kitchenStatus,
          createdAt: o.createdAt
        }))
      };
    }

    const { clearedCount, timestamp } = await orderRepository.clearBoardOrders();
    broadcastOrderBoardCleared({ clearedCount, timestamp });

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

    // Check if 60-second window or kitchen prep has started
    const createdTime = new Date(order.createdAt).getTime();
    const now = new Date().getTime();
    const elapsedSecs = Math.floor((now - createdTime) / 1000);

    const isKitchenPreparing = order.kitchenStatus && order.kitchenStatus !== 'PENDING';
    const role = requestingUser?.role;

    if (isKitchenPreparing && role !== 'ADMIN' && role !== 'COUNTER') {
      throw new ConflictError('Cannot cancel order after kitchen has started preparation', 'KITCHEN_PREP_STARTED');
    }

    if (elapsedSecs > 60 && role !== 'ADMIN' && role !== 'COUNTER') {
      throw new ConflictError('60-second undo window expired. Please request Counter or Admin to cancel.', 'UNDO_WINDOW_EXPIRED');
    }

    const cancelledOrder = await orderRepository.cancelOrderWithTransaction(id);
    broadcastKitchenStatusUpdated({ ...cancelledOrder, kitchenStatus: 'CANCELLED' });

    return cancelledOrder;
  },

  async createTableOrder(tableId, staffId, { items, customerId }) {
    const table = await tableService.getTableById(tableId);
    if (!table) {
      throw new NotFoundError('Table not found', 'TABLE_NOT_FOUND');
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
      tableId,
      staffId,
      customerId: customerId || null,
      items: preparedItems
    });

    if (table.status === 'FREE') {
      await tableRepository.update(tableId, { status: 'OCCUPIED' });
    }

    const updatedTable = await tableService.getTableById(tableId);
    broadcastOrderCreated(createdOrder);
    broadcastTableUpdate(updatedTable);

    return createdOrder;
  }
};
