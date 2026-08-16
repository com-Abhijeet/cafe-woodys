import prisma from '../../shared/db/client.mjs';

export const purchaseRepository = {
  async findById(id) {
    return prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: { inventoryItem: true }
        },
        payments: {
          orderBy: { paidAt: 'desc' }
        }
      }
    });
  },

  async findAll({ supplierId, paymentStatus, search, dateFrom, dateTo, sort = 'createdAt_desc' } = {}) {
    const where = {};

    if (supplierId) where.supplierId = supplierId;
    if (paymentStatus && paymentStatus !== 'ALL') where.paymentStatus = paymentStatus;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
        { supplier: { phone: { contains: search, mode: 'insensitive' } } }
      ];
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'createdAt_asc') orderBy = { createdAt: 'asc' };
    if (sort === 'totalCost_desc') orderBy = { totalCost: 'desc' };
    if (sort === 'totalCost_asc') orderBy = { totalCost: 'asc' };

    return prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: { inventoryItem: true }
        },
        payments: { orderBy: { paidAt: 'desc' } }
      },
      orderBy
    });
  },

  async findAllPurchasePayments({ method, search, dateFrom, dateTo, sort = 'paidAt_desc' } = {}) {
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
        { purchaseOrder: { id: { contains: search, mode: 'insensitive' } } },
        { purchaseOrder: { supplier: { name: { contains: search, mode: 'insensitive' } } } },
        { purchaseOrder: { supplier: { phone: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    let orderBy = { paidAt: 'desc' };
    if (sort === 'paidAt_asc') orderBy = { paidAt: 'asc' };
    if (sort === 'amount_desc') orderBy = { amount: 'desc' };
    if (sort === 'amount_asc') orderBy = { amount: 'asc' };

    return prisma.purchasePayment.findMany({
      where,
      include: {
        purchaseOrder: {
          include: {
            supplier: true
          }
        }
      },
      orderBy
    });
  },

  async createPurchaseOrderWithTransaction({ supplierId, items }) {
    return prisma.$transaction(async (tx) => {
      // 1. Verify supplier
      const supplier = await tx.supplier.findUnique({ where: { id: supplierId } });
      if (!supplier) {
        throw new Error('Specified supplier does not exist');
      }

      // 2. Compute total cost in paise
      const totalCost = items.reduce((sum, item) => sum + Math.round(item.quantity * item.costPerUnit), 0);

      // 3. Create PurchaseOrder
      const po = await tx.purchaseOrder.create({
        data: {
          supplierId,
          totalCost,
          paymentStatus: 'UNPAID',
          items: {
            create: items.map((item) => ({
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
              costPerUnit: item.costPerUnit
            }))
          }
        }
      });

      // 4. Update InventoryItem stock levels and snapshot latest costPerUnit
      for (const item of items) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            stockQuantity: { increment: item.quantity },
            costPerUnit: item.costPerUnit
          }
        });
      }

      return po;
    });
  },

  async addPaymentWithTransaction(purchaseOrderId, { amount, method, reference }) {
    return prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({ where: { id: purchaseOrderId } });
      if (!po) {
        throw new Error('Purchase order not found');
      }

      // 1. Record payment
      const payment = await tx.purchasePayment.create({
        data: {
          purchaseOrderId,
          amount,
          method,
          reference: reference || null,
          paidAt: new Date()
        }
      });

      // 2. Compute total paid so far
      const allPayments = await tx.purchasePayment.findMany({
        where: { purchaseOrderId }
      });
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

      // 3. Recompute paymentStatus
      let newStatus = 'UNPAID';
      if (totalPaid >= po.totalCost) {
        newStatus = 'PAID';
      } else if (totalPaid > 0) {
        newStatus = 'PARTIALLY_PAID';
      }

      // 4. Update PurchaseOrder status
      await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { paymentStatus: newStatus }
      });

      return payment;
    });
  }
};
