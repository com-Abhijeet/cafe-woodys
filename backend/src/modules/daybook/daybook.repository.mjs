import prisma from '../../shared/db/client.mjs';

export const daybookRepository = {
  async getSettings() {
    let settings = await prisma.daybookSettings.findFirst();
    if (!settings) {
      settings = await prisma.daybookSettings.create({
        data: { initialCashBalance: 0 }
      });
    }
    return settings;
  },

  async updateSettings({ initialCashBalance }) {
    const existing = await this.getSettings();
    return prisma.daybookSettings.update({
      where: { id: existing.id },
      data: { initialCashBalance }
    });
  },

  async createCashTransaction({ type, amount, reason, staffId }) {
    return prisma.cashTransaction.create({
      data: {
        type,
        amount,
        reason,
        staffId
      },
      include: {
        staff: { select: { id: true, username: true } }
      }
    });
  },

  async getPaymentsBefore(date) {
    return prisma.payment.findMany({
      where: { paidAt: { lt: date } }
    });
  },

  async getRefundsBefore(date) {
    return prisma.refund.findMany({
      where: { createdAt: { lt: date } }
    });
  },

  async getPurchasePaymentsBefore(date) {
    return prisma.purchasePayment.findMany({
      where: { paidAt: { lt: date } }
    });
  },

  async getCashTransactionsBefore(date) {
    return prisma.cashTransaction.findMany({
      where: { createdAt: { lt: date } }
    });
  },

  async getPaymentsForRange(startDate, endDate) {
    return prisma.payment.findMany({
      where: {
        paidAt: { gte: startDate, lt: endDate }
      },
      include: {
        bill: {
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            table: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { paidAt: 'asc' }
    });
  },

  async getRefundsForRange(startDate, endDate) {
    return prisma.refund.findMany({
      where: {
        createdAt: { gte: startDate, lt: endDate }
      },
      include: {
        bill: {
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            table: { select: { id: true, name: true } }
          }
        },
        staff: { select: { id: true, username: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
  },

  async getPurchasePaymentsForRange(startDate, endDate) {
    return prisma.purchasePayment.findMany({
      where: {
        paidAt: { gte: startDate, lt: endDate }
      },
      include: {
        purchaseOrder: {
          include: {
            supplier: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { paidAt: 'asc' }
    });
  },

  async getCashTransactionsForRange(startDate, endDate) {
    return prisma.cashTransaction.findMany({
      where: {
        createdAt: { gte: startDate, lt: endDate }
      },
      include: {
        staff: { select: { id: true, username: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
};
