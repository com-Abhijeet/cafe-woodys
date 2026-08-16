import prisma from '../../shared/db/client.mjs';

export const inventoryRepository = {
  async findAll({ belowThreshold } = {}) {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { adjustments: true } }
      }
    });

    if (belowThreshold) {
      return items.filter((item) => Number(item.stockQuantity) <= Number(item.reorderThreshold));
    }
    return items;
  },

  async findById(id) {
    return prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        adjustments: {
          include: { staff: { select: { id: true, username: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  },

  async create(data) {
    return prisma.inventoryItem.create({
      data: {
        name: data.name,
        unit: data.unit,
        stockQuantity: data.stockQuantity,
        reorderThreshold: data.reorderThreshold,
        costPerUnit: data.costPerUnit
      }
    });
  },

  async update(id, data) {
    return prisma.inventoryItem.update({
      where: { id },
      data
    });
  },

  async delete(id) {
    return prisma.inventoryItem.delete({
      where: { id }
    });
  },

  async createAdjustmentWithTransaction(inventoryItemId, staffId, { delta, reason, note }) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: inventoryItemId }
      });

      if (!item) {
        throw new Error('Inventory item not found');
      }

      const currentStock = Number(item.stockQuantity);
      const adjustmentDelta = Number(delta);
      const newStock = currentStock + adjustmentDelta;

      if (newStock < 0) {
        throw new Error(`Stock adjustment rejected: Stock cannot fall below 0 (Current: ${currentStock}, Adjustment: ${adjustmentDelta})`);
      }

      // Update InventoryItem stock
      const updatedItem = await tx.inventoryItem.update({
        where: { id: inventoryItemId },
        data: { stockQuantity: newStock }
      });

      // Create InventoryAdjustment audit record
      const adjustment = await tx.inventoryAdjustment.create({
        data: {
          inventoryItemId,
          staffId,
          delta: adjustmentDelta,
          reason,
          note: note || null
        },
        include: {
          staff: { select: { id: true, username: true } }
        }
      });

      return {
        item: updatedItem,
        adjustment
      };
    });
  },

  async findAdjustmentsByItemId(inventoryItemId) {
    return prisma.inventoryAdjustment.findMany({
      where: { inventoryItemId },
      include: {
        staff: { select: { id: true, username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
};
