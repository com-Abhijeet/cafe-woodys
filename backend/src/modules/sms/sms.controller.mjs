import { smsService } from './sms.service.mjs';

export const smsController = {
  async getCustomerSmsLogs(req, res, next) {
    try {
      const { customerId } = req.params;
      const logs = await smsService.getCustomerSmsLogs(customerId);
      return res.json({ data: logs });
    } catch (err) {
      next(err);
    }
  }
};
