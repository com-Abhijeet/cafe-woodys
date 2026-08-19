import prisma from '../../shared/db/client.mjs';

export const reportsRepository = {
  async getSalesSummary({ dateFrom, dateTo, groupBy = 'day' }) {
    const where = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const bills = await prisma.bill.findMany({
      where,
      select: {
        createdAt: true,
        foodTotal: true,
        gamingTotal: true,
        grandTotal: true
      },
      orderBy: { createdAt: 'asc' }
    });

    const bucketsMap = new Map();

    for (const b of bills) {
      const dt = new Date(b.createdAt);
      let key;
      if (groupBy === 'month') {
        key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      } else if (groupBy === 'week') {
        const firstJan = new Date(dt.getFullYear(), 0, 1);
        const weekNum = Math.ceil((((dt - firstJan) / 86400000) + firstJan.getDay() + 1) / 7);
        key = `${dt.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      } else {
        key = dt.toISOString().split('T')[0];
      }

      if (!bucketsMap.has(key)) {
        bucketsMap.set(key, { period: key, foodTotal: 0, gamingTotal: 0, grandTotal: 0, billCount: 0 });
      }

      const bucket = bucketsMap.get(key);
      bucket.foodTotal += b.foodTotal;
      bucket.gamingTotal += b.gamingTotal;
      bucket.grandTotal += b.grandTotal;
      bucket.billCount += 1;
    }

    // Step 7: Order Count & Dine-In / Parcel Split
    const whereOrders = {
      status: { not: 'CANCELLED' }
    };
    if (dateFrom || dateTo) {
      whereOrders.createdAt = {};
      if (dateFrom) whereOrders.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        whereOrders.createdAt.lte = endDate;
      }
    }

    const orders = await prisma.order.findMany({
      where: whereOrders,
      select: { orderType: true }
    });

    const totalOrders = orders.length;
    const dineInOrders = orders.filter((o) => o.orderType === 'DINE_IN' || !o.orderType).length;
    const parcelOrders = orders.filter((o) => o.orderType === 'PARCEL').length;

    const summary = Array.from(bucketsMap.values());

    return {
      summary,
      totalOrders,
      dineInOrders,
      parcelOrders
    };
  },

  async getTopItems({ dateFrom, dateTo, limit = 10 }) {
    const whereOrder = {};
    if (dateFrom || dateTo) {
      whereOrder.createdAt = {};
      if (dateFrom) whereOrder.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        whereOrder.createdAt.lte = endDate;
      }
    }

    whereOrder.status = { not: 'CANCELLED' };

    const orderItems = await prisma.orderItem.findMany({
      where: { order: whereOrder },
      include: {
        menuItem: { select: { id: true, name: true, category: true, price: true } }
      }
    });

    const itemMap = new Map();

    for (const item of orderItems) {
      const mId = item.menuItemId;
      const mName = item.menuItem?.name || 'Unknown Item';
      const category = item.menuItem?.category || 'General';
      const revenue = item.priceSnapshot * item.quantity;

      if (!itemMap.has(mId)) {
        itemMap.set(mId, { id: mId, name: mName, category, totalQuantity: 0, totalRevenue: 0 });
      }

      const record = itemMap.get(mId);
      record.totalQuantity += item.quantity;
      record.totalRevenue += revenue;
    }

    const itemsList = Array.from(itemMap.values());
    itemsList.sort((a, b) => b.totalQuantity - a.totalQuantity);

    return itemsList.slice(0, limit);
  },

  async getZonePerformance({ dateFrom, dateTo }) {
    const where = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const bills = await prisma.bill.findMany({
      where,
      include: {
        table: {
          include: { zone: true }
        }
      }
    });

    const zoneMap = new Map();

    for (const b of bills) {
      const zName = b.table?.zone?.name || 'Unknown Zone';
      const zType = b.table?.zone?.type || 'CAFE';

      if (!zoneMap.has(zName)) {
        zoneMap.set(zName, { zoneName: zName, type: zType, foodRevenue: 0, gamingRevenue: 0, totalRevenue: 0, billCount: 0 });
      }

      const record = zoneMap.get(zName);
      record.foodRevenue += b.foodTotal;
      record.gamingRevenue += b.gamingTotal;
      record.totalRevenue += b.grandTotal;
      record.billCount += 1;
    }

    return Array.from(zoneMap.values());
  },

  async getStaffPerformance({ dateFrom, dateTo }) {
    const whereBill = {};
    if (dateFrom || dateTo) {
      whereBill.createdAt = {};
      if (dateFrom) whereBill.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        whereBill.createdAt.lte = endDate;
      }
    }

    const bills = await prisma.bill.findMany({
      where: whereBill,
      include: {
        staff: { select: { id: true, username: true, role: true } }
      }
    });

    const staffMap = new Map();

    for (const b of bills) {
      const sId = b.staffId;
      const username = b.staff?.username || 'System';
      const role = b.staff?.role || 'ADMIN';

      if (!staffMap.has(sId)) {
        staffMap.set(sId, { id: sId, username, role, billsGenerated: 0, totalSales: 0 });
      }

      const record = staffMap.get(sId);
      record.billsGenerated += 1;
      record.totalSales += b.grandTotal;
    }

    return Array.from(staffMap.values());
  },

  async getPaymentMethodsBreakdown({ dateFrom, dateTo }) {
    const wherePay = {};
    if (dateFrom || dateTo) {
      wherePay.paidAt = {};
      if (dateFrom) wherePay.paidAt.gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        wherePay.paidAt.lte = endDate;
      }
    }

    const payments = await prisma.payment.findMany({
      where: wherePay
    });

    const methodMap = new Map();

    for (const p of payments) {
      const method = p.method || 'OTHER';
      if (!methodMap.has(method)) {
        methodMap.set(method, { method, totalAmount: 0, count: 0 });
      }

      const record = methodMap.get(method);
      record.totalAmount += p.amount;
      record.count += 1;
    }

    return Array.from(methodMap.values());
  }
};
