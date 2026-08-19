import { billingService } from './billing.service.mjs';
import { generateBillSchema, addPaymentSchema, voidBillSchema, recordRefundSchema } from './billing.validation.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';

export const billingController = {
  async generateBill(req, res, next) {
    try {
      const { tableId } = req.params;
      const parseResult = generateBillSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid bill generation input', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }

      const bill = await billingService.generateBill(tableId, req.user.id, parseResult.data);
      return res.status(201).json({ data: bill });
    } catch (err) {
      if (err.code === 'KITCHEN_NOT_FINISHED') {
        return res.status(400).json({
          error: {
            message: err.message,
            code: err.code,
            data: err.data
          }
        });
      }
      next(err);
    }
  },

  async getBillPreview(req, res, next) {
    try {
      const { tableId } = req.params;
      const preview = await billingService.getBillPreview(tableId);
      return res.json({ data: preview });
    } catch (err) {
      next(err);
    }
  },

  async checkKitchenStatus(req, res, next) {
    try {
      const { tableId } = req.params;
      const unfinished = await billingService.checkKitchenStatus(tableId);
      return res.json({ data: unfinished, isClear: unfinished.length === 0 });
    } catch (err) {
      next(err);
    }
  },

  async previewDiscount(req, res, next) {
    try {
      const { tableId } = req.params;
      const result = await billingService.previewDiscount(tableId);
      return res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async addPayment(req, res, next) {
    try {
      const { billId } = req.params;
      const parseResult = addPaymentSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid payment input', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }

      const updatedBill = await billingService.addPayment(billId, parseResult.data);
      return res.json({ data: updatedBill });
    } catch (err) {
      next(err);
    }
  },

  async bulkSettleBills(req, res, next) {
    try {
      const { billIds, method, reference } = req.body || {};
      if (!Array.isArray(billIds) || billIds.length === 0) {
        throw new ValidationError('Please provide an array of billIds to settle', 'VALIDATION_ERROR');
      }

      const settled = await billingService.bulkSettleBills(billIds, { method, reference });
      return res.json({ data: settled, count: settled.length });
    } catch (err) {
      next(err);
    }
  },

  async getBillById(req, res, next) {
    try {
      const bill = await billingService.getBillById(req.params.id);
      return res.json({ data: bill });
    } catch (err) {
      next(err);
    }
  },

  async listBills(req, res, next) {
    try {
      const { tableId, customerId, paymentStatus, search, dateFrom, dateTo, sort } = req.query;
      const bills = await billingService.listBills({ tableId, customerId, paymentStatus, search, dateFrom, dateTo, sort });
      return res.json({ data: bills });
    } catch (err) {
      next(err);
    }
  },

  async updateBillCustomer(req, res, next) {
    try {
      const { customerId } = req.body;
      const updated = await billingService.updateBillCustomer(req.params.id, customerId);
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async voidBill(req, res, next) {
    try {
      const { id } = req.params;
      const parseResult = voidBillSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid void bill input', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }

      const voided = await billingService.voidBill(id, req.user, parseResult.data);
      return res.json({ data: voided });
    } catch (err) {
      next(err);
    }
  },

  async recordRefund(req, res, next) {
    try {
      const { id } = req.params;
      const parseResult = recordRefundSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid refund input', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }

      const updatedBill = await billingService.recordRefund(id, req.user, parseResult.data);
      return res.json({ data: updatedBill });
    } catch (err) {
      next(err);
    }
  }
};
