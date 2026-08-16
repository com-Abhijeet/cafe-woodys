import { inventoryService } from './inventory.service.mjs';
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  createAdjustmentSchema
} from './inventory.validation.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';

export const inventoryController = {
  async listInventoryItems(req, res, next) {
    try {
      const { belowThreshold } = req.query;
      const filters = {};
      if (belowThreshold !== undefined) filters.belowThreshold = belowThreshold === 'true';

      const items = await inventoryService.listInventoryItems(filters);
      return res.json({ data: items });
    } catch (err) {
      next(err);
    }
  },

  async getInventoryItemById(req, res, next) {
    try {
      const item = await inventoryService.getInventoryItemById(req.params.id);
      return res.json({ data: item });
    } catch (err) {
      next(err);
    }
  },

  async createInventoryItem(req, res, next) {
    try {
      const parseResult = createInventoryItemSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid inventory item input', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }
      const newItem = await inventoryService.createInventoryItem(parseResult.data);
      return res.status(201).json({ data: newItem });
    } catch (err) {
      next(err);
    }
  },

  async updateInventoryItem(req, res, next) {
    try {
      const parseResult = updateInventoryItemSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid inventory item update', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }
      const updated = await inventoryService.updateInventoryItem(req.params.id, parseResult.data);
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteInventoryItem(req, res, next) {
    try {
      await inventoryService.deleteInventoryItem(req.params.id);
      return res.json({ data: { message: 'Inventory item deleted successfully' } });
    } catch (err) {
      next(err);
    }
  },

  async recordAdjustment(req, res, next) {
    try {
      const parseResult = createAdjustmentSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid adjustment input', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }

      const result = await inventoryService.recordAdjustment(req.params.id, req.user.id, parseResult.data);
      return res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async getItemAdjustments(req, res, next) {
    try {
      const adjustments = await inventoryService.getItemAdjustments(req.params.id);
      return res.json({ data: adjustments });
    } catch (err) {
      next(err);
    }
  }
};
