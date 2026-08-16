import { smsProvider } from './sms.provider.mjs';
import { smsRepository } from './sms.repository.mjs';

export const smsService = {
  async sendBillPaidSms({ customerId, phone, billId, grandTotal, paymentMethod }) {
    if (!phone || !customerId) return null;

    const shortId = billId ? billId.slice(-6).toUpperCase() : 'BILL';
    const amountRs = (grandTotal / 100).toFixed(2);
    const message = `Thanks for visiting Cafe Woody's! Your bill #${shortId} for ₹${amountRs} has been paid via ${paymentMethod || 'POS'}. We hope to see you again soon!`;

    let status = 'FAILED';
    try {
      const result = await smsProvider.sendSms(phone, message);
      if (result.success) {
        status = 'SENT';
      }
    } catch (err) {
      console.error('❌ Fire-and-Forget SMS Exception:', err.message);
      status = 'FAILED';
    }

    // Always record SmsLog for audit/support, never throw to caller
    try {
      return await smsRepository.createLog({
        customerId,
        phone,
        message,
        status
      });
    } catch (logErr) {
      console.error('❌ Failed to save SmsLog:', logErr.message);
      return null;
    }
  },

  async getCustomerSmsLogs(customerId) {
    return smsRepository.findByCustomerId(customerId);
  }
};
