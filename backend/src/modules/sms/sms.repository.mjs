import prisma from '../../shared/db/client.mjs';

export const smsRepository = {
  async createLog({ customerId, phone, message, status }) {
    return prisma.smsLog.create({
      data: {
        customerId,
        phone,
        message,
        status,
        sentAt: new Date()
      }
    });
  },

  async findByCustomerId(customerId) {
    return prisma.smsLog.findMany({
      where: { customerId },
      orderBy: { sentAt: 'desc' }
    });
  }
};
