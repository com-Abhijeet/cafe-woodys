import prisma from '../../shared/db/client.mjs';

export const discountRuleRepository = {
  async findAll() {
    return prisma.discountRule.findMany({
      include: {
        zone: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async findActiveRules() {
    return prisma.discountRule.findMany({
      where: { isActive: true },
      include: {
        zone: { select: { id: true, name: true } }
      }
    });
  },

  async findById(id) {
    return prisma.discountRule.findUnique({
      where: { id },
      include: { zone: true }
    });
  },

  async create(data) {
    return prisma.discountRule.create({
      data,
      include: { zone: { select: { id: true, name: true } } }
    });
  },

  async update(id, data) {
    return prisma.discountRule.update({
      where: { id },
      data,
      include: { zone: { select: { id: true, name: true } } }
    });
  },

  async delete(id) {
    return prisma.discountRule.delete({
      where: { id }
    });
  }
};
