import { menuItemService } from './menu-item.service.mjs';
import { createMenuItemSchema, updateMenuItemSchema } from './menu-item.validation.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';

export const menuItemController = {
  async listMenuItems(req, res, next) {
    try {
      const { category, available } = req.query;
      const filters = {};
      if (category) filters.category = category;
      if (available !== undefined) filters.isAvailable = available === 'true';

      const items = await menuItemService.listMenuItems(filters);
      return res.json({ data: items });
    } catch (err) {
      next(err);
    }
  },

  async getMenuItemById(req, res, next) {
    try {
      const item = await menuItemService.getMenuItemById(req.params.id);
      return res.json({ data: item });
    } catch (err) {
      next(err);
    }
  },

  async createMenuItem(req, res, next) {
    try {
      const parseResult = createMenuItemSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid menu item input', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }
      const newItem = await menuItemService.createMenuItem(parseResult.data);
      return res.status(201).json({ data: newItem });
    } catch (err) {
      next(err);
    }
  },

  async updateMenuItem(req, res, next) {
    try {
      const parseResult = updateMenuItemSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid menu item update', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }
      const updated = await menuItemService.updateMenuItem(req.params.id, parseResult.data);
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteMenuItem(req, res, next) {
    try {
      await menuItemService.deleteMenuItem(req.params.id);
      return res.json({ data: { message: 'Menu item deleted successfully' } });
    } catch (err) {
      next(err);
    }
  },

  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        throw new ValidationError('No image file provided in upload', 'MISSING_FILE');
      }

      const updatedItem = await menuItemService.uploadMenuItemImage(
        req.params.id,
        req.file.buffer,
        req.file.mimetype
      );
      return res.json({ data: updatedItem });
    } catch (err) {
      next(err);
    }
  }
};
