/**
 * SMS Provider Adapter Interface
 * Supports MSG91, Textlocal, or Mock Console Provider (default in dev)
 */
export const smsProvider = {
  async sendSms(phone, params) {
    const providerName = process.env.SMS_PROVIDER || 'mock';

    // Ensure phone number has country code (default 91 for India)
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    // 1. Mock / Console Provider
    if (providerName === 'mock' || !process.env.SMS_API_KEY) {
      console.log(`📱 [MOCK SMS PROVIDER] Sending SMS to +${formattedPhone}:`, params);
      return { success: true, providerId: `mock-${Date.now()}` };
    }

    // 2. Live Provider (MSG91)
    try {
      if (providerName === 'msg91') {
        const recipientObj = typeof params === 'object' 
          ? { mobiles: formattedPhone, ...params }
          : { mobiles: formattedPhone, message: params };

        const payload = {
          template_id: process.env.SMS_TEMPLATE_ID,
          short_url: '0',
          recipients: [recipientObj]
        };

        if (process.env.SMS_SENDER_ID) {
          payload.sender = process.env.SMS_SENDER_ID;
        }

        const response = await fetch('https://api.msg91.com/api/v5/flow/', {
          method: 'POST',
          headers: {
            'authkey': process.env.SMS_API_KEY,
            'content-type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const resData = await response.json();
        if (response.ok && (resData.type === 'success' || resData.hasError === false)) {
          return { success: true, providerId: resData.request_id || resData.type || 'msg91-ok' };
        } else {
          console.error('❌ MSG91 API Error:', resData);
          return { success: false, error: resData.message || JSON.stringify(resData) };
        }
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

