import { customerService } from './customer.service.mjs';

export const customerController = {
  async searchCustomers(req, res, next) {
    try {
      const { search } = req.query;
      const customers = await customerService.searchCustomers(search);
      return res.json({ data: customers });
    } catch (err) {
      next(err);
    }
  },

  async getCustomerById(req, res, next) {
    try {
      const customer = await customerService.getCustomerById(req.params.id);
      return res.json({ data: customer });
    } catch (err) {
      next(err);
    }
  },

  async createCustomer(req, res, next) {
    try {
      const { name, phone, notes } = req.body;
      const newCustomer = await customerService.createCustomer({ name, phone, notes });
      return res.status(201).json({ data: newCustomer });
    } catch (err) {
      next(err);
    }
  },

  async updateCustomer(req, res, next) {
    try {
      const { name, phone, notes } = req.body;
      const updated = await customerService.updateCustomer(req.params.id, { name, phone, notes });
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
};
