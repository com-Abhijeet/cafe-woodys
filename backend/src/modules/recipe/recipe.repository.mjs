import prisma from '../../shared/db/client.mjs';

export const recipeRepository = {
  async findByMenuItemId(menuItemId) {
    return prisma.recipeIngredient.findMany({
      where: { menuItemId },
      include: {
        inventoryItem: true
      },
      orderBy: { createdAt: 'asc' }
    });
  },

  async findByPair(menuItemId, inventoryItemId) {
    return prisma.recipeIngredient.findUnique({
      where: {
        menuItemId_inventoryItemId: {
          menuItemId,
          inventoryItemId
        }
      }
    });
  },

  async findById(id) {
    return prisma.recipeIngredient.findUnique({
      where: { id },
      include: { inventoryItem: true }
    });
  },

  async create({ menuItemId, inventoryItemId, quantity }) {
    return prisma.recipeIngredient.create({
      data: {
        menuItemId,
        inventoryItemId,
        quantity
      },
      include: { inventoryItem: true }
    });
  },

  async update(id, { quantity }) {
    return prisma.recipeIngredient.update({
      where: { id },
      data: { quantity },
      include: { inventoryItem: true }
    });
  },

  async delete(id) {
    return prisma.recipeIngredient.delete({
      where: { id }
    });
  }
};
