import prisma from '../../shared/db/client.mjs';

export const customerRepository = {
  async search(query) {
    const where = query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } }
          ]
        }
      : {};

    return prisma.customer.findMany({
      where,
      include: {
        _count: { select: { bills: true, orders: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async findById(id) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        bills: {
          include: { payments: true },
          orderBy: { createdAt: 'desc' }
        },
        orders: {
          include: { items: { include: { menuItem: true } } },
          orderBy: { createdAt: 'desc' }
        },
        smsLogs: {
          orderBy: { sentAt: 'desc' }
        }
      }
    });
  },

  async create(data) {
    return prisma.customer.create({
      data
    });
  },

  async update(id, data) {
    return prisma.customer.update({
      where: { id },
      data
    });
  }
};
