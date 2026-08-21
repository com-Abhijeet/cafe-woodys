import prisma from '../../shared/db/client.mjs';

export const printerRepository = {
  async findAll() {
    return prisma.printerConfig.findMany({
      orderBy: { createdAt: 'asc' }
    });
  },

  async findById(id) {
    return prisma.printerConfig.findUnique({
      where: { id }
    });
  },

  async findByDefault(purpose) {
    return prisma.printerConfig.findFirst({
      where: { purpose, isDefault: true, isEnabled: true }
    });
  },

  async create(data) {
    if (data.isDefault) {
      await prisma.printerConfig.updateMany({
        where: { purpose: data.purpose },
        data: { isDefault: false }
      });
    }

    return prisma.printerConfig.create({
      data
    });
  },

  async update(id, data) {
    if (data.isDefault && data.purpose) {
      await prisma.printerConfig.updateMany({
        where: { purpose: data.purpose, id: { not: id } },
        data: { isDefault: false }
      });
    }

    return prisma.printerConfig.update({
      where: { id },
      data
    });
  },

  async delete(id) {
    return prisma.printerConfig.delete({
      where: { id }
    });
  }
};
