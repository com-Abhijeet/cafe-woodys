import prisma from '../../shared/db/client.mjs';

export const tableRepository = {
  async findAll(zoneId) {
    const where = zoneId ? { zoneId } : {};
    return prisma.table.findMany({
      where,
      include: {
        zone: true,
        gamingSessions: {
          where: { billId: null, voidedAt: null }
        },
        orders: {
          where: { status: 'OPEN', boardClearedAt: null }
        }
      },
      orderBy: { name: 'asc' }
    });
  },

  async findById(id) {
    return prisma.table.findUnique({
      where: { id },
      include: {
        zone: true,
        gamingSessions: {
          where: { billId: null, voidedAt: null }
        },
        orders: {
          where: { status: 'OPEN', boardClearedAt: null },
          include: {
            items: {
              include: { menuItem: true }
            }
          }
        }
      }
    });
  },

  async create(data) {
    return prisma.table.create({
      data,
      include: { zone: true }
    });
  },

  async update(id, data) {
    return prisma.table.update({
      where: { id },
      data,
      include: {
        zone: true,
        gamingSessions: {
          where: { billId: null, voidedAt: null }
        }
      }
    });
  },

  async delete(id) {
    return prisma.table.delete({
      where: { id }
    });
  },

  async countHistory(tableId) {
    const [ordersCount, sessionsCount, billsCount] = await Promise.all([
      prisma.order.count({ where: { tableId } }),
      prisma.gamingSession.count({ where: { tableId } }),
      prisma.bill.count({ where: { tableId } })
    ]);
    return ordersCount + sessionsCount + billsCount;
  }
};
