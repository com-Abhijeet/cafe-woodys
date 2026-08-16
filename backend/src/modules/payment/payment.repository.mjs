import prisma from '../../shared/db/client.mjs';

export const paymentRepository = {
  async findAllPayments({ method, dateFrom, dateTo, staffId, search, sort = 'paidAt_desc' }) {
    const where = {};

    if (method && method !== 'ALL') {
      where.method = method;
    }

    if (dateFrom || dateTo) {
      where.paidAt = {};
      if (dateFrom) where.paidAt.gte = new Date(dateFrom);
      if (dateTo) where.paidAt.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { bill: { id: { contains: search, mode: 'insensitive' } } },
        { bill: { table: { name: { contains: search, mode: 'insensitive' } } } },
        { bill: { customer: { name: { contains: search, mode: 'insensitive' } } } },
        { bill: { customer: { phone: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    if (staffId) {
      where.bill = { ...where.bill, staffId };
    }

    let orderBy = { paidAt: 'desc' };
    if (sort === 'paidAt_asc') orderBy = { paidAt: 'asc' };
    if (sort === 'amount_desc') orderBy = { amount: 'desc' };
    if (sort === 'amount_asc') orderBy = { amount: 'asc' };

    return prisma.payment.findMany({
      where,
      include: {
        bill: {
          include: {
            table: { select: { id: true, name: true } },
            staff: { select: { id: true, username: true } },
            customer: { select: { id: true, name: true, phone: true } }
          }
        }
      },
      orderBy
    });
  }
};
