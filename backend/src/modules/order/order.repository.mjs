import prisma from '../../shared/db/client.mjs';
import { ConflictError } from '../../shared/errors/conflict-error.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';

async function getNextDailyOrderNumber(tx) {
  const lastOrder = await tx.order.findFirst({
    where: { boardClearedAt: null },
    orderBy: { dailyOrderNumber: 'desc' }
  });
  return (lastOrder?.dailyOrderNumber ?? 0) + 1;
}

export const orderRepository = {
  async findByTableId(tableId, status = 'OPEN') {
    const where = { tableId };
    if (status) where.status = status;

    return prisma.order.findMany({
      where,
      include: {
        staff: {
          select: { id: true, username: true }
        },
        customer: true,
        items: {
          include: { menuItem: true, voidedByStaff: { select: { id: true, username: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async findById(id) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        table: { select: { id: true, name: true, zoneId: true } },
        staff: { select: { id: true, username: true } },
        customer: { select: { id: true, name: true, phone: true } },
        items: {
          include: { menuItem: true, voidedByStaff: { select: { id: true, username: true } } }
        }
      }
    });
  },

  async findOrderItemById(orderItemId) {
    return prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: {
          include: {
            table: { select: { id: true, name: true } }
          }
        },
        menuItem: true
      }
    });
  },

  async voidOrderItemWithTransaction(orderItemId, staffId, reason, ignoreKitchenStatus = false) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.orderItem.findUnique({
        where: { id: orderItemId },
        include: { order: true }
      });

      if (!item) {
        throw new NotFoundError('Order item not found', 'ORDER_ITEM_NOT_FOUND');
      }

      if (item.voidedAt) {
        throw new ConflictError('Order item is already voided', 'ITEM_ALREADY_VOIDED');
      }

      const isCorrectionMode = Boolean(item.order.reopenedFromBillId) || ignoreKitchenStatus;

      if (item.order.kitchenStatus !== 'PENDING' && !isCorrectionMode) {
        throw new ConflictError('Cannot void item after kitchen preparation has started', 'KITCHEN_PREP_STARTED');
      }

      // Restore recipe ingredient stock
      const ingredients = await tx.recipeIngredient.findMany({
        where: { menuItemId: item.menuItemId }
      });

      for (const ing of ingredients) {
        const qtyToRestore = Number(ing.quantity) * item.quantity;
        await tx.inventoryItem.update({
          where: { id: ing.inventoryItemId },
          data: { stockQuantity: { increment: qtyToRestore } }
        });
      }

      // Mark order item as voided
      await tx.orderItem.update({
        where: { id: orderItemId },
        data: {
          voidedAt: new Date(),
          voidReason: reason.trim(),
          voidedByStaffId: staffId
        }
      });

      // Fetch refreshed full order
      return tx.order.findUnique({
        where: { id: item.orderId },
        include: {
          table: { select: { id: true, name: true } },
          staff: { select: { id: true, username: true } },
          customer: { select: { id: true, name: true, phone: true } },
          items: { include: { menuItem: true, voidedByStaff: { select: { id: true, username: true } } } }
        }
      });
    });
  },

  async voidAndReplaceOrderItemWithTransaction(orderItemId, staffId, { reason, replacement }) {
    return prisma.$transaction(async (tx) => {
      const oldItem = await tx.orderItem.findUnique({
        where: { id: orderItemId },
        include: { order: true }
      });

      if (!oldItem) throw new NotFoundError('Order item not found', 'ORDER_ITEM_NOT_FOUND');
      if (oldItem.voidedAt) throw new ConflictError('Order item is already voided', 'ITEM_ALREADY_VOIDED');

      // 1. Restore stock for old item
      const oldIngredients = await tx.recipeIngredient.findMany({
        where: { menuItemId: oldItem.menuItemId }
      });
      for (const ing of oldIngredients) {
        const qtyToRestore = Number(ing.quantity) * oldItem.quantity;
        await tx.inventoryItem.update({
          where: { id: ing.inventoryItemId },
          data: { stockQuantity: { increment: qtyToRestore } }
        });
      }

      // 2. Mark old item as voided
      await tx.orderItem.update({
        where: { id: orderItemId },
        data: {
          voidedAt: new Date(),
          voidReason: reason.trim(),
          voidedByStaffId: staffId
        }
      });

      // 3. Create replacement line item if provided
      if (replacement && replacement.menuItemId && replacement.quantity > 0) {
        const menuItem = await tx.menuItem.findUnique({ where: { id: replacement.menuItemId } });
        if (!menuItem) throw new NotFoundError('Replacement menu item not found', 'MENU_ITEM_NOT_FOUND');

        // Deduct ingredient stock for replacement
        const repIngredients = await tx.recipeIngredient.findMany({
          where: { menuItemId: replacement.menuItemId },
          include: { inventoryItem: true }
        });
        for (const ing of repIngredients) {
          const needed = Number(ing.quantity) * replacement.quantity;
          await tx.inventoryItem.update({
            where: { id: ing.inventoryItemId },
            data: { stockQuantity: { decrement: needed } }
          });
        }

        const gstPercentSnapshot = menuItem.gstPercent != null ? Number(menuItem.gstPercent) : 5;
        const priceSnapshot = replacement.priceOverride != null ? Number(replacement.priceOverride) : menuItem.price;

        await tx.orderItem.create({
          data: {
            orderId: oldItem.orderId,
            menuItemId: replacement.menuItemId,
            quantity: replacement.quantity,
            priceSnapshot,
            gstPercentSnapshot
          }
        });
      }

      return tx.order.findUnique({
        where: { id: oldItem.orderId },
        include: {
          table: { select: { id: true, name: true } },
          staff: { select: { id: true, username: true } },
          customer: { select: { id: true, name: true, phone: true } },
          items: { include: { menuItem: true, voidedByStaff: { select: { id: true, username: true } } } }
        }
      });
    });
  },

  async addOrderItemToOrderWithTransaction(orderId, { menuItemId, quantity, priceOverride }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND');

      const menuItem = await tx.menuItem.findUnique({ where: { id: menuItemId } });
      if (!menuItem) throw new NotFoundError('Menu item not found', 'MENU_ITEM_NOT_FOUND');

      // Deduct inventory
      const ingredients = await tx.recipeIngredient.findMany({
        where: { menuItemId },
        include: { inventoryItem: true }
      });
      for (const ing of ingredients) {
        const needed = Number(ing.quantity) * quantity;
        await tx.inventoryItem.update({
          where: { id: ing.inventoryItemId },
          data: { stockQuantity: { decrement: needed } }
        });
      }

      const gstPercentSnapshot = menuItem.gstPercent != null ? Number(menuItem.gstPercent) : 5;
      const priceSnapshot = priceOverride != null ? Number(priceOverride) : menuItem.price;

      await tx.orderItem.create({
        data: {
          orderId,
          menuItemId,
          quantity,
          priceSnapshot,
          gstPercentSnapshot
        }
      });

      return tx.order.findUnique({
        where: { id: orderId },
        include: {
          table: { select: { id: true, name: true } },
          staff: { select: { id: true, username: true } },
          customer: { select: { id: true, name: true, phone: true } },
          items: { include: { menuItem: true, voidedByStaff: { select: { id: true, username: true } } } }
        }
      });
    });
  },

  async findActiveUnbilledOrders({ type = 'all' } = {}) {
    const where = {
      status: 'OPEN',
      billId: null
    };

    if (type === 'dine-in') {
      where.orderType = 'DINE_IN';
    } else if (type === 'parcel') {
      where.orderType = 'PARCEL';
    }

    return prisma.order.findMany({
      where,
      include: {
        table: { select: { id: true, name: true, zone: { select: { id: true, name: true } } } },
        staff: { select: { id: true, username: true } },
        customer: { select: { id: true, name: true, phone: true } },
        items: {
          include: { menuItem: true, voidedByStaff: { select: { id: true, username: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async findAllOrders({ kitchenStatus, tableId, orderType, status, sort = 'createdAt_desc', includeCleared = false } = {}) {
    const where = {};
    if (!includeCleared) {
      where.boardClearedAt = null;
    }
    if (tableId) where.tableId = tableId;
    if (orderType) where.orderType = orderType;

    // By default, exclude CANCELLED orders unless explicitly requested
    if (status) {
      where.status = status;
    } else {
      where.status = { not: 'CANCELLED' };
    }

    if (kitchenStatus && kitchenStatus !== 'ALL') {
      where.kitchenStatus = kitchenStatus;
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'createdAt_asc') orderBy = { createdAt: 'asc' };

    return prisma.order.findMany({
      where,
      include: {
        table: { select: { id: true, name: true } },
        staff: { select: { id: true, username: true } },
        customer: { select: { id: true, name: true, phone: true } },
        items: { include: { menuItem: true, voidedByStaff: { select: { id: true, username: true } } } }
      },
      orderBy
    });
  },

  async findUnresolvedBoardOrders() {
    return prisma.order.findMany({
      where: {
        boardClearedAt: null,
        OR: [
          { status: 'OPEN' },
          { kitchenStatus: { not: 'SERVED' } }
        ]
      },
      include: {
        table: { select: { id: true, name: true } },
        items: { select: { id: true, quantity: true, voidedAt: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async clearBoardOrders() {
    return prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1. Auto-cancel lingering unbilled OPEN orders so they do not leak into Pending Bills tomorrow
      await tx.order.updateMany({
        where: {
          status: 'OPEN',
          billId: null
        },
        data: {
          status: 'CANCELLED',
          boardClearedAt: now
        }
      });

      // 2. Mark boardClearedAt on all remaining uncleared orders
      const result = await tx.order.updateMany({
        where: { boardClearedAt: null },
        data: { boardClearedAt: now }
      });

      // 3. Reset ALL tables to FREE status
      await tx.table.updateMany({
        where: { status: { not: 'FREE' } },
        data: { status: 'FREE' }
      });

      // 4. Close any active gaming sessions
      await tx.gamingSession.updateMany({
        where: { status: 'ACTIVE' },
        data: {
          status: 'CLOSED',
          endTime: now
        }
      });

      return { clearedCount: result.count, timestamp: now };
    });
  },

  async updateKitchenStatus(id, kitchenStatus) {
    return prisma.order.update({
      where: { id },
      data: { kitchenStatus },
      include: {
        table: { select: { id: true, name: true } },
        staff: { select: { id: true, username: true } },
        customer: { select: { id: true, name: true, phone: true } },
        items: { include: { menuItem: true, voidedByStaff: { select: { id: true, username: true } } } }
      }
    });
  },

  async cancelOrderWithTransaction(id) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!order) throw new Error('Order not found');

      // 1. Restore recipe inventory stock for non-voided items
      for (const item of order.items) {
        if (!item.voidedAt) {
          const ingredients = await tx.recipeIngredient.findMany({
            where: { menuItemId: item.menuItemId }
          });

          for (const ing of ingredients) {
            const qtyToRestore = Number(ing.quantity) * item.quantity;
            await tx.inventoryItem.update({
              where: { id: ing.inventoryItemId },
              data: { stockQuantity: { increment: qtyToRestore } }
            });
          }
        }
      }

      // 2. Mark order status as CANCELLED
      return tx.order.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: {
          table: { select: { id: true, name: true } },
          staff: { select: { id: true, username: true } },
          items: { include: { menuItem: true, voidedByStaff: { select: { id: true, username: true } } } }
        }
      });
    });
  },

  async createOrderWithTransaction({ tableId, orderType = 'DINE_IN', staffId, customerId, items }) {
    return prisma.$transaction(async (tx) => {
      // 1. Generate sequential daily order number for current business day (resets on Close Day)
      const dailyOrderNumber = await getNextDailyOrderNumber(tx);

      // 2. Auto-deduct raw material inventory for recipe-linked menu items
      for (const item of items) {
        const ingredients = await tx.recipeIngredient.findMany({
          where: { menuItemId: item.menuItemId },
          include: { inventoryItem: true, menuItem: true }
        });

        for (const ing of ingredients) {
          const needed = Number(ing.quantity) * item.quantity;
          const result = await tx.inventoryItem.updateMany({
            where: {
              id: ing.inventoryItemId,
              stockQuantity: { gte: needed }
            },
            data: {
              stockQuantity: { decrement: needed }
            }
          });

          if (result.count === 0) {
            throw new ConflictError(
              `Insufficient stock for ingredient '${ing.inventoryItem.name}' to prepare '${ing.menuItem?.name || 'Item'}'. (Needed: ${needed} ${ing.inventoryItem.unit})`,
              'INSUFFICIENT_RECIPE_STOCK'
            );
          }
        }
      }

      // 3. Create Order & OrderItem rows
      return tx.order.create({
        data: {
          tableId: orderType === 'PARCEL' ? null : tableId,
          orderType,
          dailyOrderNumber,
          staffId,
          customerId: customerId || null,
          status: 'OPEN',
          kitchenStatus: 'PENDING',
          items: {
            create: items.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              priceSnapshot: item.priceSnapshot,
              gstPercentSnapshot: item.gstPercentSnapshot
            }))
          }
        },
        include: {
          table: { select: { id: true, name: true } },
          staff: { select: { id: true, username: true } },
          customer: { select: { id: true, name: true, phone: true } },
          items: { include: { menuItem: true } }
        }
      });
    });
  }
};
