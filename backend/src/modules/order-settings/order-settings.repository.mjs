import prisma from '../../shared/db/client.mjs';

export const orderSettingsRepository = {
  async getSettings() {
    let settings = await prisma.orderSettings.findFirst();
    if (!settings) {
      settings = await prisma.orderSettings.create({
        data: {
          orderCancellationWindowSeconds: 300
        }
      });
    }
    return settings;
  },

  async updateSettings(data) {
    const existing = await this.getSettings();
    return prisma.orderSettings.update({
      where: { id: existing.id },
      data: {
        ...(data.orderCancellationWindowSeconds !== undefined && {
          orderCancellationWindowSeconds: Number(data.orderCancellationWindowSeconds)
        })
      }
    });
  }
};
