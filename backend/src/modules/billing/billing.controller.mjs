import { billingService } from './billing.service.mjs';
import { generateBillSchema, addPaymentSchema } from './billing.validation.mjs';
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
  }
};
