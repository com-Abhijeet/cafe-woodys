import prisma from '../../shared/db/client.mjs';

export const taxSettingsRepository = {
  async getSettings() {
    let settings = await prisma.taxSettings.findFirst();
    if (!settings) {
      settings = await prisma.taxSettings.create({
        data: {
          defaultGstPercent: 5,
          pricesIncludeTax: false
        }
      });
    }
    return settings;
  },

  async updateSettings(data) {
    const existing = await this.getSettings();
    return prisma.taxSettings.update({
      where: { id: existing.id },
      data: {
        ...(data.defaultGstPercent !== undefined && { defaultGstPercent: Number(data.defaultGstPercent) }),
        ...(data.pricesIncludeTax !== undefined && { pricesIncludeTax: Boolean(data.pricesIncludeTax) })
      }
    });
  }
};
