import { orderService } from './order.service.mjs';
import { createOrderSchema, updateKitchenStatusSchema } from './order.validation.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';

export const orderController = {
  async getTableOrders(req, res, next) {
    try {
      const { tableId } = req.params;
      const { status } = req.query;
      const result = await orderService.getTableOrders(tableId, status || 'OPEN');
      return res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async listOrders(req, res, next) {
    try {
      const { kitchenStatus, tableId, orderType, status, sort } = req.query;
      const orders = await orderService.listOrders({ kitchenStatus, tableId, orderType, status, sort });
      return res.json({ data: orders });
    } catch (err) {
      next(err);
    }
  },

  async updateKitchenStatus(req, res, next) {
    try {
      const { id } = req.params;
      const parseResult = updateKitchenStatusSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid kitchen status input', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }

      const updated = await orderService.updateKitchenStatus(id, parseResult.data.kitchenStatus, req.user);
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const cancelled = await orderService.cancelOrder(id, req.user);
      return res.json({ data: cancelled });
    } catch (err) {
      next(err);
    }
  },

  async createOrder(req, res, next) {
    try {
      const parseResult = createOrderSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid order input', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }

      const tableId = req.params.tableId || parseResult.data.tableId;
      const newOrder = await orderService.createOrder(req.user.id, {
        ...parseResult.data,
        tableId
      });
      return res.status(201).json({ data: newOrder });
    } catch (err) {
      next(err);
    }
  },

  async createTableOrder(req, res, next) {
    return this.createOrder(req, res, next);
  },

  async closeDay(req, res, next) {
    try {
      const { force } = req.body || {};
      const result = await orderService.closeDay({ force: !!force });
      return res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
};
