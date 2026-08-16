import prisma from '../../shared/db/client.mjs';

export const zoneRepository = {
  async findAll() {
    return prisma.zone.findMany({
      include: {
        tables: {
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  },

  async findById(id) {
    return prisma.zone.findUnique({
      where: { id },
      include: {
        tables: true
      }
    });
  },

  async create(data) {
    return prisma.zone.create({
      data
    });
  },

  async update(id, data) {
    return prisma.zone.update({
      where: { id },
      data
    });
  },

  async delete(id) {
    return prisma.zone.delete({
      where: { id }
    });
  },

  async countTables(zoneId) {
    return prisma.table.count({
      where: { zoneId }
    });
  }
};
