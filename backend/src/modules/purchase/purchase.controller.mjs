import { purchaseService } from './purchase.service.mjs';
import { createPurchaseOrderSchema, addPurchasePaymentSchema } from './purchase.validation.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';

export const purchaseController = {
  async listPurchaseOrders(req, res, next) {
    try {
      const { supplierId, paymentStatus, search, dateFrom, dateTo, sort } = req.query;
      const orders = await purchaseService.listPurchaseOrders({ supplierId, paymentStatus, search, dateFrom, dateTo, sort });
      return res.json({ data: orders });
    } catch (err) {
      next(err);
    }
  },

  async listPurchasePayments(req, res, next) {
    try {
      const { method, search, dateFrom, dateTo, sort } = req.query;
      const data = await purchaseService.listPurchasePayments({ method, search, dateFrom, dateTo, sort });
      return res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async getPurchaseOrderById(req, res, next) {
    try {
      const po = await purchaseService.getPurchaseOrderById(req.params.id);
      return res.json({ data: po });
    } catch (err) {
      next(err);
    }
  },

  async createPurchaseOrder(req, res, next) {
    try {
      const parseResult = createPurchaseOrderSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid purchase order input', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }
      const newOrder = await purchaseService.createPurchaseOrder(parseResult.data);
      return res.status(201).json({ data: newOrder });
    } catch (err) {
      next(err);
    }
  },

  async addPayment(req, res, next) {
    try {
      const { id } = req.params;
      const parseResult = addPurchasePaymentSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid supplier payment input', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }
      const updatedPO = await purchaseService.addPayment(id, parseResult.data);
      return res.json({ data: updatedPO });
    } catch (err) {
      next(err);
    }
  }
};
