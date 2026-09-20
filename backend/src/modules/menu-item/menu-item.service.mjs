import { menuItemRepository } from './menu-item.repository.mjs';
import { uploadToCloudinary } from '../../shared/utils/cloudinary.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';
import { settingsCache } from '../../shared/utils/settings-cache.mjs';

const MENU_ITEMS_CACHE_KEY = 'ALL_MENU_ITEMS';

async function getCachedMenuItemsMap() {
  let itemMap = settingsCache.get(MENU_ITEMS_CACHE_KEY);
  if (!itemMap) {
    const allItems = await menuItemRepository.findAll({});
    itemMap = new Map(allItems.map((i) => [i.id, i]));
    settingsCache.set(MENU_ITEMS_CACHE_KEY, itemMap);
  }
  return itemMap;
}

export const menuItemService = {
  async listMenuItems(filters = {}) {
    const itemMap = await getCachedMenuItemsMap();
    let list = Array.from(itemMap.values());

    if (filters.category) {
      list = list.filter((i) => i.category === filters.category);
    }
    if (typeof filters.isAvailable === 'boolean') {
      list = list.filter((i) => i.isAvailable === filters.isAvailable);
    }
    return list;
  },

  async getMenuItemById(id) {
    const itemMap = await getCachedMenuItemsMap();
    const item = itemMap.get(id);
    if (!item) {
      throw new NotFoundError('Menu item not found', 'MENU_ITEM_NOT_FOUND');
    }
    return item;
  },

  async getMenuItemsByIds(ids) {
    const itemMap = await getCachedMenuItemsMap();
    const results = [];
    const missingIds = [];

    for (const id of ids) {
      if (itemMap.has(id)) {
        results.push(itemMap.get(id));
      } else {
        missingIds.push(id);
      }
    }

    // If any items are missing from cache, query DB once for safety
    if (missingIds.length > 0) {
      const dbItems = await menuItemRepository.findByIds(missingIds);
      dbItems.forEach((i) => {
        itemMap.set(i.id, i);
        results.push(i);
      });
      settingsCache.set(MENU_ITEMS_CACHE_KEY, itemMap);
    }

    return results;
  },

  async createMenuItem(data) {
    const created = await menuItemRepository.create(data);
    settingsCache.invalidate(MENU_ITEMS_CACHE_KEY);
    return created;
  },

  async updateMenuItem(id, data) {
    const existing = await this.getMenuItemById(id);
    if (!existing) {
      throw new NotFoundError('Menu item not found', 'MENU_ITEM_NOT_FOUND');
    }
    const updated = await menuItemRepository.update(id, data);
    settingsCache.invalidate(MENU_ITEMS_CACHE_KEY);
    return updated;
  },

  async deleteMenuItem(id) {
    const existing = await this.getMenuItemById(id);
    if (!existing) {
      throw new NotFoundError('Menu item not found', 'MENU_ITEM_NOT_FOUND');
    }
    const deleted = await menuItemRepository.delete(id);
    settingsCache.invalidate(MENU_ITEMS_CACHE_KEY);
    return deleted;
  },

  async uploadMenuItemImage(id, fileBuffer, mimeType) {
    const existing = await this.getMenuItemById(id);
    if (!existing) {
      throw new NotFoundError('Menu item not found', 'MENU_ITEM_NOT_FOUND');
    }

    const imageUrl = await uploadToCloudinary(fileBuffer, mimeType);
    const updated = await menuItemRepository.update(id, { imageUrl });
    settingsCache.invalidate(MENU_ITEMS_CACHE_KEY);
    return updated;
  }
};
