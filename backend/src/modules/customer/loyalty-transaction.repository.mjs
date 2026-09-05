import prisma from '../../shared/db/client.mjs';

export const loyaltyTransactionRepository = {
  async getCustomerBalance(customerId, tx = prisma) {
    const result = await tx.loyaltyTransaction.aggregate({
      where: { customerId },
      _sum: { pointsDelta: true },
    });
    return result._sum.pointsDelta || 0;
  },

  async getCustomerTransactions(customerId, tx = prisma) {
    return tx.loyaltyTransaction.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        bill: {
          select: {
            id: true,
            invoiceNumber: true,
            financialYear: true,
            grandTotal: true,
          },
        },
        staff: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  },

  async createTransaction(data, tx = prisma) {
    return tx.loyaltyTransaction.create({
      data: {
        customerId: data.customerId,
        billId: data.billId || null,
        type: data.type,
        pointsDelta: Number(data.pointsDelta),
        note: data.note || null,
        staffId: data.staffId || null,
      },
    });
  },
};
