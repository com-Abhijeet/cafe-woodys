import { daybookService } from './daybook.service.mjs';

export const daybookController = {
  async getDaybook(req, res, next) {
    try {
      const { date } = req.query;
      const data = await daybookService.getDaybook(date);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async exportDaybookCsv(req, res, next) {
    try {
      const { dateFrom, dateTo } = req.query;
      const csv = await daybookService.exportDaybookCsv({ dateFrom, dateTo });
      const filename = `daybook-${dateFrom || 'today'}-to-${dateTo || 'today'}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  },

  async addCashTransaction(req, res, next) {
    try {
      const { type, amount, reason } = req.body;
      const staffId = req.user.id;
      const data = await daybookService.addCashTransaction({ type, amount, reason, staffId });
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async getSettings(req, res, next) {
    try {
      const data = await daybookService.getSettings();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async updateSettings(req, res, next) {
    try {
      const { initialCashBalance } = req.body;
      if (typeof initialCashBalance !== 'number') {
        return res.status(400).json({ error: 'initialCashBalance must be a number in paise' });
      }
      const data = await daybookService.updateSettings({ initialCashBalance });
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
};
