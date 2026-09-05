import prisma from '../../shared/db/client.mjs';

export const loyaltySettingsRepository = {
  async getSettings(tx = prisma) {
    let settings = await tx.loyaltySettings.findFirst();
    if (!settings) {
      settings = await tx.loyaltySettings.create({
        data: {
          isEnabled: false,
          pointsEarnedPerUnit: 1,
          spendUnitInRupees: 10,
          maxRedemptionPercentOfBill: null,
        },
      });
    }
    return settings;
  },

  async updateSettings(data, tx = prisma) {
    const existing = await this.getSettings(tx);
    return tx.loyaltySettings.update({
      where: { id: existing.id },
      data: {
        ...(typeof data.isEnabled === 'boolean' && { isEnabled: data.isEnabled }),
        ...(data.pointsEarnedPerUnit !== undefined && { pointsEarnedPerUnit: Number(data.pointsEarnedPerUnit) }),
        ...(data.spendUnitInRupees !== undefined && { spendUnitInRupees: Number(data.spendUnitInRupees) }),
        ...(data.maxRedemptionPercentOfBill !== undefined && {
          maxRedemptionPercentOfBill: data.maxRedemptionPercentOfBill === null || data.maxRedemptionPercentOfBill === '' 
            ? null 
            : Number(data.maxRedemptionPercentOfBill),
        }),
      },
    });
  },
};
