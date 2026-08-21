import prisma from '../../shared/db/client.mjs';

export const kitchenPrintSettingsRepository = {
  async getSettings() {
    let settings = await prisma.kitchenPrintSettings.findFirst();
    if (!settings) {
      settings = await prisma.kitchenPrintSettings.create({
        data: {
          printOnEveryOrder: false,
          printWithParcelBill: false
        }
      });
    }
    return settings;
  },

  async updateSettings(data) {
    const existing = await this.getSettings();
    return prisma.kitchenPrintSettings.update({
      where: { id: existing.id },
      data: {
        ...(data.printOnEveryOrder !== undefined && { printOnEveryOrder: Boolean(data.printOnEveryOrder) }),
        ...(data.printWithParcelBill !== undefined && { printWithParcelBill: Boolean(data.printWithParcelBill) })
      }
    });
  }
};
