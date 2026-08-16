import prisma from '../../shared/db/client.mjs';

export const supplierRepository = {
  async findAll() {
    return prisma.supplier.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { purchaseOrders: true } }
      }
    });
  },

  async findById(id) {
    return prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
  },

  async create(data) {
    return prisma.supplier.create({
      data
    });
  },

  async update(id, data) {
    return prisma.supplier.update({
      where: { id },
      data
    });
  },

  async delete(id) {
    return prisma.supplier.delete({
      where: { id }
    });
  }
};
