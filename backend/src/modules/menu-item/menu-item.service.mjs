import { menuItemRepository } from './menu-item.repository.mjs';
import { uploadToCloudinary } from '../../shared/utils/cloudinary.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';

export const menuItemService = {
  async listMenuItems(filters = {}) {
    return menuItemRepository.findAll(filters);
  },

  async getMenuItemById(id) {
    const item = await menuItemRepository.findById(id);
    if (!item) {
      throw new NotFoundError('Menu item not found', 'MENU_ITEM_NOT_FOUND');
    }
    return item;
  },

  async createMenuItem(data) {
    return menuItemRepository.create(data);
  },

  async updateMenuItem(id, data) {
    const existing = await menuItemRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Menu item not found', 'MENU_ITEM_NOT_FOUND');
    }
    return menuItemRepository.update(id, data);
  },

  async deleteMenuItem(id) {
    const existing = await menuItemRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Menu item not found', 'MENU_ITEM_NOT_FOUND');
    }
    return menuItemRepository.delete(id);
  },

  async uploadMenuItemImage(id, fileBuffer, mimeType) {
    const existing = await menuItemRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Menu item not found', 'MENU_ITEM_NOT_FOUND');
    }

    const imageUrl = await uploadToCloudinary(fileBuffer, mimeType);
    return menuItemRepository.update(id, { imageUrl });
  }
};
