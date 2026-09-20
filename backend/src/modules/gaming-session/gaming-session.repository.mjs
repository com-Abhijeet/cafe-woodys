import prisma from '../../shared/db/client.mjs';

export const gamingSessionRepository = {
  async findActiveByTableId(tableId) {
    return prisma.gamingSession.findMany({
      where: {
        tableId,
        status: 'ACTIVE'
      },
      orderBy: { startTime: 'asc' }
    });
  },

  async findById(id) {
    return prisma.gamingSession.findUnique({
      where: { id },
      include: { table: { include: { zone: true } } }
    });
  },

  async countActiveByTableId(tableId) {
    return prisma.gamingSession.count({
      where: {
        tableId,
        status: 'ACTIVE'
      }
    });
  },

  async create(data) {
    return prisma.gamingSession.create({
      data
    });
  },

  async createMany(dataArray) {
    return prisma.gamingSession.createMany({
      data: dataArray
    });
  },

  async closeSession(id, endTime) {
    return prisma.gamingSession.update({
      where: { id },
      data: {
        endTime,
        status: 'CLOSED'
      }
    });
  }
};
