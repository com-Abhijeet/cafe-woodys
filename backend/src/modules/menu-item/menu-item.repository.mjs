import prisma from '../../shared/db/client.mjs';

export const menuItemRepository = {
  async findAll({ category, isAvailable }) {
    const where = {};
    if (category) where.category = category;
    if (typeof isAvailable === 'boolean') where.isAvailable = isAvailable;

    return prisma.menuItem.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });
  },

  async findById(id) {
    return prisma.menuItem.findUnique({
      where: { id }
    });
  },

  async findByIds(ids) {
    return prisma.menuItem.findMany({
      where: { id: { in: ids } }
    });
  },

  async create(data) {
    return prisma.menuItem.create({
      data
    });
  },

  async update(id, data) {
    return prisma.menuItem.update({
      where: { id },
      data
    });
  },

  async delete(id) {
    return prisma.menuItem.delete({
      where: { id }
    });
  }
};
