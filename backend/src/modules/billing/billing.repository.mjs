import prisma from '../../shared/db/client.mjs';

export const billingRepository = {
  async findBillById(id) {
    return prisma.bill.findUnique({
      where: { id },
      include: {
        table: { include: { zone: true } },
        staff: { select: { id: true, username: true } },
        voidedByStaff: { select: { id: true, username: true } },
        customer: true,
        correctionOfBill: {
          select: { id: true, invoiceNumber: true, financialYear: true, grandTotal: true, paymentStatus: true, voidedAt: true }
        },
        correctedByBill: {
          select: { id: true, invoiceNumber: true, financialYear: true, grandTotal: true, paymentStatus: true }
        },
        orders: {
          include: {
            items: { include: { menuItem: true, voidedByStaff: { select: { id: true, username: true } } } }
          }
        },
        gamingSessions: true,
        payments: {
          orderBy: { paidAt: 'desc' }
        },
        refunds: {
          include: { staff: { select: { id: true, username: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  },

  async findAllBills({ tableId, customerId, paymentStatus, search, dateFrom, dateTo, sort = 'createdAt_desc' }) {
    const where = {};

    if (tableId) where.tableId = tableId;
    if (customerId) where.customerId = customerId;

    if (paymentStatus && paymentStatus !== 'ALL') {
      where.paymentStatus = paymentStatus;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search) {
      const searchNum = parseInt(search, 10);
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { financialYear: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search, mode: 'insensitive' } } },
        { table: { name: { contains: search, mode: 'insensitive' } } }
      ];
      if (!isNaN(searchNum)) {
        where.OR.push({ invoiceNumber: searchNum });
      }
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'createdAt_asc') orderBy = { createdAt: 'asc' };
    if (sort === 'grandTotal_desc') orderBy = { grandTotal: 'desc' };
    if (sort === 'grandTotal_asc') orderBy = { grandTotal: 'asc' };

    return prisma.bill.findMany({
      where,
      include: {
        table: { select: { id: true, name: true } },
        staff: { select: { id: true, username: true } },
        voidedByStaff: { select: { id: true, username: true } },
        customer: { select: { id: true, name: true, phone: true } },
        correctionOfBill: {
          select: { id: true, invoiceNumber: true, financialYear: true }
        },
        correctedByBill: {
          select: { id: true, invoiceNumber: true, financialYear: true }
        },
        payments: { orderBy: { paidAt: 'desc' } },
        refunds: { orderBy: { createdAt: 'desc' } },
        orders: { include: { items: { include: { menuItem: true } } } },
        gamingSessions: true
      },
      orderBy
    });
  }
};
