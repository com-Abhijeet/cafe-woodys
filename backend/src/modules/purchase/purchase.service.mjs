import { purchaseRepository } from './purchase.repository.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';

function formatPurchaseOrder(po) {
  if (!po) return null;
  const totalPaid = (po.payments || []).reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = Math.max(0, po.totalCost - totalPaid);

  const formattedItems = (po.items || []).map((i) => ({
    ...i,
    quantity: Number(i.quantity)
  }));

  return {
    ...po,
    items: formattedItems,
    totalPaid,
    remainingBalance
  };
}

export const purchaseService = {
  async getPurchaseOrderById(id) {
    const po = await purchaseRepository.findById(id);
    if (!po) {
      throw new NotFoundError('Purchase order not found', 'PURCHASE_ORDER_NOT_FOUND');
    }
    return formatPurchaseOrder(po);
  },

  async listPurchaseOrders(filters = {}) {
    const orders = await purchaseRepository.findAll(filters);
    return orders.map(formatPurchaseOrder);
  },

  async listPurchasePayments(filters = {}) {
    const payments = await purchaseRepository.findAllPurchasePayments(filters);
    const totalAmountPaise = payments.reduce((sum, p) => sum + p.amount, 0);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayPayments = payments.filter((p) => new Date(p.paidAt) >= startOfToday);
    const todayTotalPaise = todayPayments.reduce((sum, p) => sum + p.amount, 0);

    const cashTotalPaise = payments.filter((p) => p.method === 'CASH').reduce((sum, p) => sum + p.amount, 0);
    const bankTotalPaise = payments.filter((p) => p.method === 'BANK_TRANSFER' || p.method === 'UPI').reduce((sum, p) => sum + p.amount, 0);

    return {
      summary: {
        totalAmountPaise,
        totalCount: payments.length,
        todayTotalPaise,
        todayCount: todayPayments.length,
        cashTotalPaise,
        bankTotalPaise
      },
      payments
    };
  },

  async createPurchaseOrder(data) {
    try {
      const created = await purchaseRepository.createPurchaseOrderWithTransaction(data);
      return this.getPurchaseOrderById(created.id);
    } catch (err) {
      throw new ValidationError(err.message, 'PURCHASE_ORDER_FAILED');
    }
  },

  async addPayment(id, paymentData) {
    const existing = await purchaseRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Purchase order not found', 'PURCHASE_ORDER_NOT_FOUND');
    }

    try {
      await purchaseRepository.addPaymentWithTransaction(id, paymentData);
      return this.getPurchaseOrderById(id);
    } catch (err) {
      throw new ValidationError(err.message, 'PAYMENT_RECORD_FAILED');
    }
  }
};
