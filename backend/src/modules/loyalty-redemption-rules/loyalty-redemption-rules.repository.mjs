import prisma from '../../shared/db/client.mjs';

export const loyaltyRedemptionRulesRepository = {
  async findAll(tx = prisma) {
    return tx.loyaltyRedemptionRule.findMany({
      orderBy: { pointsRequired: 'asc' },
    });
  },

  async findById(id, tx = prisma) {
    return tx.loyaltyRedemptionRule.findUnique({
      where: { id },
    });
  },

  async create(data, tx = prisma) {
    return tx.loyaltyRedemptionRule.create({
      data: {
        pointsRequired: Number(data.pointsRequired),
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
        isActive: data.isActive ?? true,
      },
    });
  },

  async update(id, data, tx = prisma) {
    return tx.loyaltyRedemptionRule.update({
      where: { id },
      data: {
        ...(data.pointsRequired !== undefined && { pointsRequired: Number(data.pointsRequired) }),
        ...(data.discountType !== undefined && { discountType: data.discountType }),
        ...(data.discountValue !== undefined && { discountValue: Number(data.discountValue) }),
        ...(typeof data.isActive === 'boolean' && { isActive: data.isActive }),
      },
    });
  },

  async delete(id, tx = prisma) {
    return tx.loyaltyRedemptionRule.delete({
      where: { id },
    });
  },
};
