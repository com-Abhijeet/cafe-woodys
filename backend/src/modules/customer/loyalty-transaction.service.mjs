import { loyaltyTransactionRepository } from './loyalty-transaction.repository.mjs';
import { loyaltySettingsRepository } from '../loyalty-settings/loyalty-settings.repository.mjs';
import { customerRepository } from './customer.repository.mjs';

export const loyaltyTransactionService = {
  async getCustomerLoyalty(customerId) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) {
      const err = new Error('Customer not found');
      err.statusCode = 404;
      throw err;
    }
    const balance = await loyaltyTransactionRepository.getCustomerBalance(customerId);
    const transactions = await loyaltyTransactionRepository.getCustomerTransactions(customerId);
    return { balance, transactions };
  },

  async createManualAdjustment(customerId, staffId, { pointsDelta, note }) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) {
      const err = new Error('Customer not found');
      err.statusCode = 404;
      throw err;
    }

    const delta = Number(pointsDelta);
    if (isNaN(delta) || delta === 0) {
      const err = new Error('pointsDelta must be a non-zero integer');
      err.statusCode = 400;
      throw err;
    }

    if (!note || !note.trim()) {
      const err = new Error('A note is required for manual adjustments');
      err.statusCode = 400;
      throw err;
    }

    return loyaltyTransactionRepository.createTransaction({
      customerId,
      staffId,
      type: 'ADJUSTED',
      pointsDelta: delta,
      note: note.trim(),
    });
  },

  async creditLoyaltyPointsIfEarned(bill, tx) {
    const settings = await loyaltySettingsRepository.getSettings(tx);
    if (!settings.isEnabled) return;
    if (bill.paymentStatus !== 'PAID') return;
    if (!bill.customerId) return;

    const alreadyEarned = await tx.loyaltyTransaction.findFirst({
      where: { billId: bill.id, type: 'EARNED' },
    });
    if (alreadyEarned) return;

    const earningBase =
      (bill.foodTotal || 0) +
      (bill.gamingTotal || 0) -
      (bill.discountAmount || 0) -
      (bill.loyaltyDiscountAmount || 0);

    if (earningBase <= 0) return;

    const points =
      Math.floor((earningBase / 100) / settings.spendUnitInRupees) *
      settings.pointsEarnedPerUnit;

    if (points > 0) {
      await tx.loyaltyTransaction.create({
        data: {
          customerId: bill.customerId,
          billId: bill.id,
          type: 'EARNED',
          pointsDelta: points,
        },
      });
    }
  },

  async reverseLoyaltyOnVoid(bill, tx) {
    const earned = await tx.loyaltyTransaction.findFirst({
      where: { billId: bill.id, type: 'EARNED' },
    });

    if (earned) {
      await tx.loyaltyTransaction.create({
        data: {
          customerId: bill.customerId,
          billId: bill.id,
          type: 'REVERSED',
          pointsDelta: -earned.pointsDelta,
          note: 'Reversed — bill voided',
        },
      });
    }

    if (bill.loyaltyPointsRedeemed > 0 && bill.customerId) {
      await tx.loyaltyTransaction.create({
        data: {
          customerId: bill.customerId,
          billId: bill.id,
          type: 'REVERSED',
          pointsDelta: bill.loyaltyPointsRedeemed,
          note: 'Points returned — bill voided',
        },
      });
    }
  },
};
