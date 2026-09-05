import prisma from '../../shared/db/client.mjs';

export const gamingSettingsRepository = {
  async getSettings() {
    let settings = await prisma.gamingSettings.findFirst();
    if (!settings) {
      settings = await prisma.gamingSettings.create({
        data: {
          gamingGracePeriodMinutes: 5
        }
      });
    }
    return settings;
  },

  async updateSettings(data) {
    const existing = await this.getSettings();
    return prisma.gamingSettings.update({
      where: { id: existing.id },
      data: {
        ...(data.gamingGracePeriodMinutes !== undefined && {
          gamingGracePeriodMinutes: Number(data.gamingGracePeriodMinutes)
        })
      }
    });
  }
};
