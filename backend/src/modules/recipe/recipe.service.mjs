import { recipeRepository } from './recipe.repository.mjs';
import { menuItemRepository } from '../menu-item/menu-item.repository.mjs';
import { inventoryRepository } from '../inventory/inventory.repository.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';
import { ConflictError } from '../../shared/errors/conflict-error.mjs';

function formatIngredient(ing) {
  if (!ing) return null;
  return {
    ...ing,
    quantity: Number(ing.quantity)
  };
}

export const recipeService = {
  async getRecipeByMenuItemId(menuItemId) {
    const menuItem = await menuItemRepository.findById(menuItemId);
    if (!menuItem) {
      throw new NotFoundError('Menu item not found', 'MENU_ITEM_NOT_FOUND');
    }

    const ingredients = await recipeRepository.findByMenuItemId(menuItemId);
    return ingredients.map(formatIngredient);
  },

  async addIngredient(menuItemId, { inventoryItemId, quantity }) {
    const menuItem = await menuItemRepository.findById(menuItemId);
    if (!menuItem) {
      throw new NotFoundError('Menu item not found', 'MENU_ITEM_NOT_FOUND');
    }

    const inventoryItem = await inventoryRepository.findById(inventoryItemId);
    if (!inventoryItem) {
      throw new NotFoundError('Inventory item not found', 'INVENTORY_ITEM_NOT_FOUND');
    }

    const existing = await recipeRepository.findByPair(menuItemId, inventoryItemId);
    if (existing) {
      throw new ConflictError(
        `Ingredient '${inventoryItem.name}' is already in the recipe for '${menuItem.name}'`,
        'DUPLICATE_RECIPE_INGREDIENT'
      );
    }

    const created = await recipeRepository.create({
      menuItemId,
      inventoryItemId,
      quantity
    });

    return formatIngredient(created);
  },

  async updateIngredient(id, { quantity }) {
    const existing = await recipeRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Recipe ingredient line not found', 'RECIPE_LINE_NOT_FOUND');
    }

    const updated = await recipeRepository.update(id, { quantity });
    return formatIngredient(updated);
  },

  async removeIngredient(id) {
    const existing = await recipeRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Recipe ingredient line not found', 'RECIPE_LINE_NOT_FOUND');
    }

    return recipeRepository.delete(id);
  }
};
