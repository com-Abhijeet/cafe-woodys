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
        gamingGracePeriodMinutes: 5,
        orderCancellationWindowSeconds: 300,
        printerIpAddress: null,
        pricesIncludeTax: false,
        thermalPaperWidthMm: 80,
        thermalCharsPerLineOverride: null,
        upiId: null,
        upiPayeeName: null,
        autoMarkBillsPaidInFull: false
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
        ...(data.gamingGracePeriodMinutes !== undefined && { gamingGracePeriodMinutes: data.gamingGracePeriodMinutes }),
        ...(data.orderCancellationWindowSeconds !== undefined && { orderCancellationWindowSeconds: data.orderCancellationWindowSeconds }),
        ...(data.printerIpAddress !== undefined && { printerIpAddress: data.printerIpAddress }),
        ...(data.pricesIncludeTax !== undefined && { pricesIncludeTax: data.pricesIncludeTax }),
        ...(data.thermalPaperWidthMm !== undefined && { thermalPaperWidthMm: data.thermalPaperWidthMm }),
        ...(data.thermalCharsPerLineOverride !== undefined && { thermalCharsPerLineOverride: data.thermalCharsPerLineOverride }),
        ...(data.upiId !== undefined && { upiId: data.upiId }),
        ...(data.upiPayeeName !== undefined && { upiPayeeName: data.upiPayeeName }),
        ...(data.autoMarkBillsPaidInFull !== undefined && { autoMarkBillsPaidInFull: data.autoMarkBillsPaidInFull })
      }
    });
  }
};
