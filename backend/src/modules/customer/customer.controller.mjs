import { customerService } from './customer.service.mjs';
import { loyaltyTransactionService } from './loyalty-transaction.service.mjs';

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
  },

  async getLoyalty(req, res, next) {
    try {
      const loyaltyData = await loyaltyTransactionService.getCustomerLoyalty(req.params.id);
      return res.json({ data: loyaltyData });
    } catch (err) {
      next(err);
    }
  },

  async adjustLoyaltyPoints(req, res, next) {
    try {
      const staffId = req.user.id;
      const { pointsDelta, note } = req.body;
      const txn = await loyaltyTransactionService.createManualAdjustment(req.params.id, staffId, { pointsDelta, note });
      return res.status(201).json({ data: txn });
    } catch (err) {
      next(err);
    }
  },

  async getCustomerBalances(req, res, next) {
    try {
      const { sort } = req.query;
      const balances = await customerService.getCustomerBalances({ sort });
      return res.json({ data: balances });
    } catch (err) {
      next(err);
    }
  },

  async getCustomerLedger(req, res, next) {
    try {
      const ledger = await customerService.getCustomerLedger(req.params.id);
      return res.json({ data: ledger });
    } catch (err) {
      next(err);
    }
  },

  async exportCustomerLedgerCsv(req, res, next) {
    try {
      const csv = await customerService.exportCustomerLedgerCsv(req.params.id);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="customer-ledger-${req.params.id}.csv"`);
      return res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
};
