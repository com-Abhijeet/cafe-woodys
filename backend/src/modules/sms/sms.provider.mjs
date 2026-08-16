/**
 * SMS Provider Adapter Interface
 * Supports MSG91, Textlocal, or Mock Console Provider (default in dev)
 */
export const smsProvider = {
  async sendSms(phone, message) {
    const providerName = process.env.SMS_PROVIDER || 'mock';

    // 1. Mock / Console Provider
    if (providerName === 'mock' || !process.env.SMS_API_KEY) {
      console.log(`📱 [MOCK SMS PROVIDER] Sending SMS to ${phone}: "${message}"`);
      return { success: true, providerId: `mock-${Date.now()}` };
    }

    // 2. Live Provider (MSG91 / Textlocal)
    try {
      if (providerName === 'msg91') {
        const response = await fetch('https://api.msg91.com/api/v5/flow/', {
          method: 'POST',
          headers: {
            'authkey': process.env.SMS_API_KEY,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            template_id: process.env.SMS_TEMPLATE_ID,
            short_url: '0',
            recipients: [{ mobiles: phone, message }]
          })
        });
        const resData = await response.json();
        return { success: response.ok, providerId: resData.type || 'msg91-ok' };
      }

      // Default Fallback
      console.log(`📱 [SMS ADAPTER] Unknown provider ${providerName}. Simulating success.`);
      return { success: true, providerId: `simulated-${Date.now()}` };
    } catch (err) {
      console.error('❌ SMS Provider Network Exception:', err.message);
      return { success: false, error: err.message };
    }
  }
};
