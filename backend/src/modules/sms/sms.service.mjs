import { smsProvider } from './sms.provider.mjs';
import { smsRepository } from './sms.repository.mjs';

export const smsService = {
  async sendBillPaidSms({ customerId, phone, billId, grandTotal, paymentMethod, fullBill }) {
    if (!phone || !customerId) return null;

    const shortId = billId ? billId.slice(-6).toUpperCase() : 'BILL';
    const amountRs = (grandTotal / 100).toFixed(2);

    // Extract item breakdown for the SMS
    let itemsSummary = '';
    if (fullBill?.orders) {
      const itemMap = new Map();
      for (const order of fullBill.orders) {
        for (const item of (order.items || [])) {
          if (item.voidedAt) continue;
          const name = item.menuItem?.name || 'Item';
          itemMap.set(name, (itemMap.get(name) || 0) + item.quantity);
        }
      }
      const parts = [];
      itemMap.forEach((qty, name) => parts.push(`${qty}x ${name}`));
      itemsSummary = parts.join(', ');
    }

    if (!itemsSummary) {
      itemsSummary = 'Café & Gaming Services';
    }

    // Keep item summary concise for SMS (max 90 chars)
    if (itemsSummary.length > 90) {
      itemsSummary = itemsSummary.slice(0, 87) + '...';
    }

    const templateParams = {
      bill_no: shortId,
      items: itemsSummary,
      total: amountRs,
      payment_mode: paymentMethod || 'POS'
    };

    const auditMessage = `Bill #${shortId} | Items: ${itemsSummary} | Total: ₹${amountRs} | Mode: ${paymentMethod || 'POS'}`;

    let status = 'FAILED';
    try {
      const result = await smsProvider.sendSms(phone, templateParams);
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
        message: auditMessage,
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

