import { paymentRepository } from './payment.repository.mjs';

export const paymentService = {
  async listPayments(filters = {}) {
    const payments = await paymentRepository.findAllPayments(filters);

    // Compute Summary Stats
    const totalAmountPaise = payments.reduce((sum, p) => sum + p.amount, 0);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayPayments = payments.filter((p) => new Date(p.paidAt) >= startOfToday);
    const todayTotalPaise = todayPayments.reduce((sum, p) => sum + p.amount, 0);

    const cashTotalPaise = payments.filter((p) => p.method === 'CASH').reduce((sum, p) => sum + p.amount, 0);
    const upiTotalPaise = payments.filter((p) => p.method === 'UPI').reduce((sum, p) => sum + p.amount, 0);
    const cardTotalPaise = payments.filter((p) => p.method === 'CARD').reduce((sum, p) => sum + p.amount, 0);

    return {
      summary: {
        totalAmountPaise,
        totalCount: payments.length,
        todayTotalPaise,
        todayCount: todayPayments.length,
        cashTotalPaise,
        upiTotalPaise,
        cardTotalPaise
      },
      payments
    };
  }
};
