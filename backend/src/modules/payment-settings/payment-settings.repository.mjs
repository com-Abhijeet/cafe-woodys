import prisma from '../../shared/db/client.mjs';

export const paymentSettingsRepository = {
  async getSettings() {
    let settings = await prisma.paymentSettings.findFirst();
    if (!settings) {
      settings = await prisma.paymentSettings.create({
        data: {
          upiId: null,
          upiPayeeName: null,
          autoMarkBillsPaidInFull: false,
          alwaysSaveAndPrint: false
        }
      });
    }
    return settings;
  },

  async updateSettings(data) {
    const existing = await this.getSettings();
    return prisma.paymentSettings.update({
      where: { id: existing.id },
      data: {
        ...(data.upiId !== undefined && { upiId: data.upiId ? String(data.upiId).trim() : null }),
        ...(data.upiPayeeName !== undefined && { upiPayeeName: data.upiPayeeName ? String(data.upiPayeeName).trim() : null }),
        ...(data.autoMarkBillsPaidInFull !== undefined && { autoMarkBillsPaidInFull: Boolean(data.autoMarkBillsPaidInFull) }),
        ...(data.alwaysSaveAndPrint !== undefined && { alwaysSaveAndPrint: Boolean(data.alwaysSaveAndPrint) })
      }
    });
  }
};
