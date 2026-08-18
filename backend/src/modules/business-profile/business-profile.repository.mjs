import prisma from '../../shared/db/client.mjs';

export const businessProfileRepository = {
  async findFirst() {
    return prisma.businessProfile.findFirst();
  },

  async createDefault() {
    return prisma.businessProfile.create({
      data: {
        businessName: "Café Woody's",
        address: "Main Street, Café Woody's Complex",
        phone: "+91 98765 43210",
        email: "contact@cafewoodys.com",
        gstin: "",
        fssaiNumber: "",
        logoUrl: null,
        receiptFooterNote: "Thank you for visiting Café Woody's! Visit again.",
        defaultGstPercent: 5,
        gamingGracePeriodMinutes: 5
      }
    });
  },

  async update(id, data) {
    return prisma.businessProfile.update({
      where: { id },
      data: {
        ...(data.businessName !== undefined && { businessName: data.businessName }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.gstin !== undefined && { gstin: data.gstin }),
        ...(data.fssaiNumber !== undefined && { fssaiNumber: data.fssaiNumber }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.receiptFooterNote !== undefined && { receiptFooterNote: data.receiptFooterNote }),
        ...(data.defaultGstPercent !== undefined && { defaultGstPercent: data.defaultGstPercent }),
        ...(data.gamingGracePeriodMinutes !== undefined && { gamingGracePeriodMinutes: data.gamingGracePeriodMinutes })
      }
    });
  }
};
