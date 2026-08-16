import { paymentService } from './payment.service.mjs';

export const paymentController = {
  async listPayments(req, res, next) {
    try {
      const { method, dateFrom, dateTo, staffId, search, sort } = req.query;
      const data = await paymentService.listPayments({ method, dateFrom, dateTo, staffId, search, sort });
      return res.json({ data });
    } catch (err) {
      next(err);
    }
  }
};
