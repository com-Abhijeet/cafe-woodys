import { inventoryRepository } from './inventory.repository.mjs';
import { broadcastInventoryLowStock } from '../../realtime/broadcast.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';

function formatItem(item) {
  if (!item) return null;
  const stockQuantity = Number(item.stockQuantity);
  const reorderThreshold = Number(item.reorderThreshold);
  const isLowStock = stockQuantity <= reorderThreshold;

  return {
    ...item,
    stockQuantity,
    reorderThreshold,
    isLowStock
  };
}

export const inventoryService = {
  async listInventoryItems(filters = {}) {
    const items = await inventoryRepository.findAll(filters);
    return items.map(formatItem);
  },

  async getInventoryItemById(id) {
    const item = await inventoryRepository.findById(id);
    if (!item) {
      throw new NotFoundError('Inventory item not found', 'INVENTORY_ITEM_NOT_FOUND');
    }
    return formatItem(item);
  },

  async createInventoryItem(data) {
    const item = await inventoryRepository.create(data);
    const formatted = formatItem(item);
    if (formatted.isLowStock) {
      broadcastInventoryLowStock({
        itemId: formatted.id,
        itemName: formatted.name,
        currentStock: formatted.stockQuantity,
        reorderThreshold: formatted.reorderThreshold
      });
    }
    return formatted;
  },

  async updateInventoryItem(id, data) {
    const existing = await inventoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Inventory item not found', 'INVENTORY_ITEM_NOT_FOUND');
    }
    const oldFormatted = formatItem(existing);
    const updated = await inventoryRepository.update(id, data);
    const newFormatted = formatItem(updated);

    if (!oldFormatted.isLowStock && newFormatted.isLowStock) {
      broadcastInventoryLowStock({
        itemId: newFormatted.id,
        itemName: newFormatted.name,
        currentStock: newFormatted.stockQuantity,
        reorderThreshold: newFormatted.reorderThreshold
      });
    }
    return newFormatted;
  },

  async deleteInventoryItem(id) {
    const existing = await inventoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Inventory item not found', 'INVENTORY_ITEM_NOT_FOUND');
    }
    return inventoryRepository.delete(id);
  },

  async recordAdjustment(id, staffId, adjustmentData) {
    const existing = await inventoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Inventory item not found', 'INVENTORY_ITEM_NOT_FOUND');
    }
    const oldFormatted = formatItem(existing);

    try {
      const result = await inventoryRepository.createAdjustmentWithTransaction(id, staffId, adjustmentData);
      const newFormatted = formatItem(result.item);

      if (!oldFormatted.isLowStock && newFormatted.isLowStock) {
        broadcastInventoryLowStock({
          itemId: newFormatted.id,
          itemName: newFormatted.name,
          currentStock: newFormatted.stockQuantity,
          reorderThreshold: newFormatted.reorderThreshold
        });
      }

      return {
        item: newFormatted,
        adjustment: result.adjustment
      };
    } catch (err) {
      throw new ValidationError(err.message, 'ADJUSTMENT_REJECTED');
    }
  },

  async getItemAdjustments(id) {
    const existing = await inventoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Inventory item not found', 'INVENTORY_ITEM_NOT_FOUND');
    }
    return inventoryRepository.findAdjustmentsByItemId(id);
  }
};
