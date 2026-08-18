import prisma from '../../shared/db/client.mjs';
import { billingRepository } from './billing.repository.mjs';
import { tableService } from '../table/table.service.mjs';
import { discountRuleRepository } from '../discount-rule/discount-rule.repository.mjs';
import { calculateSlotCharge } from '../gaming-session/gaming-session.service.mjs';
import { businessProfileService } from '../business-profile/business-profile.service.mjs';
import { smsService } from '../sms/sms.service.mjs';
import { broadcastBillCreated, broadcastTableUpdate } from '../../realtime/broadcast.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';
import { ConflictError } from '../../shared/errors/conflict-error.mjs';

export function getFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  const isBeforeApril = date.getMonth() < 3; // Jan/Feb/Mar (months 0, 1, 2) belong to previous FY
  const startYear = isBeforeApril ? year - 1 : year;
  return `${startYear}-${String(startYear + 1).slice(-2)}`; // e.g. "2025-26"
}

async function generateInvoiceNumber(tx, billDate = new Date()) {
  const financialYear = getFinancialYear(billDate);
  const count = await tx.bill.count({ where: { financialYear } });
  return { invoiceNumber: count + 1, financialYear };
}

export function calculateLineAmounts(amount, gstPercent, pricesIncludeTax) {
  const rate = Number(gstPercent || 0);
  if (pricesIncludeTax) {
    // amount already contains tax — extract it rather than add it
    const taxableBase = amount / (1 + rate / 100);
    const totalTax = amount - taxableBase;
    const roundedTax = Math.round(totalTax);
    const cgst = Math.round(roundedTax / 2);
    const sgst = roundedTax - cgst;
    return {
      taxableBase: Math.round(taxableBase),
      totalTax: roundedTax,
      cgst,
      sgst,
      lineTotal: amount
    };
  }

  // Default behavior — tax added on top of menu price
  const totalTax = Math.round(amount * (rate / 100));
  const cgst = Math.round(totalTax / 2);
  const sgst = totalTax - cgst;
  return {
    taxableBase: amount,
    totalTax,
    cgst,
    sgst,
    lineTotal: amount + totalTax
  };
}

function enrichBill(bill) {
  if (!bill) return null;

  const totalPaid = (bill.payments || []).reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = Math.max(0, bill.grandTotal - totalPaid);

  return {
    ...bill,
    totalPaid,
    remainingBalance
  };
}

export const billingService = {
  async getBillById(id) {
    const bill = await billingRepository.findBillById(id);
    if (!bill) {
      throw new NotFoundError('Bill not found', 'BILL_NOT_FOUND');
    }
    return enrichBill(bill);
  },

  async listBills(filters = {}) {
    const bills = await billingRepository.findAllBills(filters);
    return bills.map(enrichBill);
  },

  // Phase 17 Step 5: Check kitchen status for unserved orders before bill commit
  async checkKitchenStatus(tableId) {
    const openOrders = await prisma.order.findMany({
      where: { tableId, status: 'OPEN' },
      include: {
        items: {
          include: { menuItem: true }
        }
      }
    });

    const unfinished = [];
    for (const order of openOrders) {
      if (order.kitchenStatus !== 'SERVED') {
        unfinished.push({
          orderId: order.id,
          kitchenStatus: order.kitchenStatus,
          createdAt: order.createdAt,
          items: order.items.map((i) => ({
            name: i.menuItem?.name || 'Item',
            quantity: i.quantity
          }))
        });
      }
    }

    return unfinished;
  },

  // Phase 17 Step 6: Non-destructive, read-only bill preview endpoint
  async getBillPreview(tableId) {
    const table = await tableService.getTableById(tableId);
    if (!table) {
      throw new NotFoundError('Table not found', 'TABLE_NOT_FOUND');
    }

    const openOrders = await prisma.order.findMany({
      where: { tableId, status: 'OPEN' },
      include: { items: { include: { menuItem: true } } }
    });

    const unbilledSessions = await prisma.gamingSession.findMany({
      where: { tableId, billId: null }
    });

    const profile = await businessProfileService.getProfile();
    const graceMinutes = profile?.gamingGracePeriodMinutes ?? 5;
    const pricesIncludeTax = Boolean(profile?.pricesIncludeTax);
    const now = new Date();

    const lines = [];
    let foodTotal = 0;

    for (const order of openOrders) {
      for (const item of order.items) {
        const itemTotal = item.priceSnapshot * item.quantity;
        foodTotal += itemTotal;
        lines.push({
          subtotal: itemTotal,
          gstPercent: Number(item.gstPercentSnapshot || 5)
        });
      }
    }

    let gamingTotal = 0;
    for (const session of unbilledSessions) {
      const sessionEndTime = (session.status === 'ACTIVE' || !session.endTime) ? now : session.endTime;
      const elapsedMinutes = Math.max(1, Math.ceil((sessionEndTime - new Date(session.startTime)) / (1000 * 60)));
      const charge = calculateSlotCharge(
        elapsedMinutes,
        session.halfHourRateSnapshot,
        session.hourlyRateSnapshot,
        session.maxChargeCap,
        graceMinutes
      );
      gamingTotal += charge;
      lines.push({
        subtotal: charge,
        gstPercent: Number(session.gstPercentSnapshot || 18)
      });
    }

    const grossSubtotal = foodTotal + gamingTotal;
    const discountPreview = await this.previewDiscount(tableId);
    const discountAmount = discountPreview.suggestedDiscountAmount || 0;
    const discountReason = discountPreview.suggestedDiscountReason || null;

    let totalCgst = 0;
    let totalSgst = 0;

    for (const line of lines) {
      let lineAmount = line.subtotal;
      if (discountAmount > 0 && grossSubtotal > 0) {
        const lineDiscount = Math.round((line.subtotal / grossSubtotal) * discountAmount);
        lineAmount = Math.max(0, line.subtotal - lineDiscount);
      }
      const { cgst, sgst } = calculateLineAmounts(lineAmount, line.gstPercent, pricesIncludeTax);
      totalCgst += cgst;
      totalSgst += sgst;
    }

    const grandTotal = pricesIncludeTax
      ? Math.max(0, grossSubtotal - discountAmount)
      : Math.max(0, grossSubtotal - discountAmount) + totalCgst + totalSgst;

    const unfinishedKitchenOrders = await this.checkKitchenStatus(tableId);

    return {
      table: { id: table.id, name: table.name, zone: table.zone },
      foodTotal,
      gamingTotal,
      grossSubtotal,
      discountAmount,
      discountReason,
      cgstAmount: totalCgst,
      sgstAmount: totalSgst,
      grandTotal,
      orders: openOrders,
      gamingSessions: unbilledSessions,
      unfinishedKitchenOrders,
      pricesIncludeTax
    };
  },

  async previewDiscount(tableId) {
    const table = await tableService.getTableById(tableId);
    if (!table) return { suggestedDiscountAmount: 0, suggestedDiscountReason: null };

    const activeRules = await discountRuleRepository.findActiveRules();
    if (activeRules.length === 0) {
      return { suggestedDiscountAmount: 0, suggestedDiscountReason: null };
    }

    const openOrders = await prisma.order.findMany({
      where: { tableId, status: 'OPEN' },
      include: { items: true }
    });
    const unbilledSessions = await prisma.gamingSession.findMany({
      where: { tableId, billId: null }
    });

    const profile = await businessProfileService.getProfile();
    const graceMinutes = profile?.gamingGracePeriodMinutes ?? 5;

    const now = new Date();
    let foodTotal = 0;
    for (const order of openOrders) {
      for (const item of order.items) {
        foodTotal += item.priceSnapshot * item.quantity;
      }
    }

    let gamingTotal = 0;
    for (const session of unbilledSessions) {
      const sessionEndTime = (session.status === 'ACTIVE' || !session.endTime) ? now : session.endTime;
      const elapsedMinutes = Math.max(1, Math.ceil((sessionEndTime - new Date(session.startTime)) / (1000 * 60)));
      gamingTotal += calculateSlotCharge(
        elapsedMinutes,
        session.halfHourRateSnapshot,
        session.hourlyRateSnapshot,
        session.maxChargeCap,
        graceMinutes
      );
    }

    const grossTotal = foodTotal + gamingTotal;
    if (grossTotal === 0) return { suggestedDiscountAmount: 0, suggestedDiscountReason: null };

    const todayDay = now.getDay();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let bestDiscountAmount = 0;
    let bestDiscountReason = null;

    for (const rule of activeRules) {
      if (rule.daysOfWeek?.length > 0 && !rule.daysOfWeek.includes(todayDay)) continue;
      if (rule.startTime && currentTimeStr < rule.startTime) continue;
      if (rule.endTime && currentTimeStr > rule.endTime) continue;

      let baseAmount = 0;
      if (rule.scope === 'ALL') baseAmount = grossTotal;
      else if (rule.scope === 'CAFE_ONLY') baseAmount = foodTotal;
      else if (rule.scope === 'GAMING_ONLY') baseAmount = gamingTotal;
      else if (rule.scope === 'ZONE') {
        if (table.zoneId === rule.zoneId) baseAmount = gamingTotal;
      }

      if (baseAmount <= 0) continue;

      let calcDiscount = 0;
      if (rule.type === 'PERCENTAGE') {
        calcDiscount = Math.round(baseAmount * (Number(rule.value) / 100));
      } else {
        calcDiscount = Math.min(baseAmount, Number(rule.value));
      }

      if (calcDiscount > bestDiscountAmount) {
        bestDiscountAmount = calcDiscount;
        bestDiscountReason = rule.name;
      }
    }

    return {
      suggestedDiscountAmount: bestDiscountAmount,
      suggestedDiscountReason: bestDiscountReason
    };
  },

  async generateBill(tableId, staffId, { discountAmount = 0, discountReason = null, customerId = null, autoPayMethod = null, ignoreKitchenWarning = false }) {
    const table = await tableService.getTableById(tableId);
    if (!table) {
      throw new NotFoundError('Table not found', 'TABLE_NOT_FOUND');
    }

    // Phase 17 Step 5: Check kitchen status unless ignoreKitchenWarning override is true
    if (!ignoreKitchenWarning) {
      const unfinished = await this.checkKitchenStatus(tableId);
      if (unfinished.length > 0) {
        const err = new ValidationError('Table has unfinished kitchen orders that have not been served yet', 'KITCHEN_NOT_FINISHED');
        err.data = { unfinishedOrders: unfinished };
        throw err;
      }
    }

    if (discountAmount > 0 && (!discountReason || !discountReason.trim())) {
      throw new ValidationError('A discount reason is mandatory whenever a discount is applied', 'DISCOUNT_REASON_REQUIRED');
    }

    if (table.status === 'billing_in_progress') {
      throw new ConflictError('Billing checkout is already in progress for this table. Please wait.', 'BILLING_IN_PROGRESS');
    }

    const profile = await businessProfileService.getProfile();
    const graceMinutes = profile?.gamingGracePeriodMinutes ?? 5;
    const pricesIncludeTax = Boolean(profile?.pricesIncludeTax);
    const now = new Date();

    // Execute checkout in single atomic database transaction
    const createdBill = await prisma.$transaction(async (tx) => {
      // Step 0: Lock table status to OCCUPIED
      await tx.table.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' }
      });

      // 1. Fetch unbilled OPEN orders
      const openOrders = await tx.order.findMany({
        where: { tableId, status: 'OPEN' },
        include: { items: true }
      });

      // 2. Fetch unbilled gaming sessions (billId = null)
      const unbilledSessions = await tx.gamingSession.findMany({
        where: { tableId, billId: null }
      });

      // Auto-close any active sessions & compute charges with grace period
      const sessionChargesList = [];
      for (const session of unbilledSessions) {
        let sessionEndTime = session.endTime;
        if (session.status === 'ACTIVE' || !sessionEndTime) {
          sessionEndTime = now;
          await tx.gamingSession.update({
            where: { id: session.id },
            data: { endTime: sessionEndTime, status: 'CLOSED' }
          });
        }

        const elapsedMinutes = Math.max(1, Math.ceil((sessionEndTime - new Date(session.startTime)) / (1000 * 60)));
        const charge = calculateSlotCharge(
          elapsedMinutes,
          session.halfHourRateSnapshot,
          session.hourlyRateSnapshot,
          session.maxChargeCap,
          graceMinutes
        );
        sessionChargesList.push({
          charge,
          gstPercent: Number(session.gstPercentSnapshot || 18)
        });
      }

      // 3. Build line items list for multi-rate tax calculation
      const lines = [];
      let foodTotal = 0;

      for (const order of openOrders) {
        for (const item of order.items) {
          const itemTotal = item.priceSnapshot * item.quantity;
          foodTotal += itemTotal;
          lines.push({
            subtotal: itemTotal,
            gstPercent: Number(item.gstPercentSnapshot || 5)
          });
        }
      }

      let gamingTotal = 0;
      for (const sc of sessionChargesList) {
        gamingTotal += sc.charge;
        lines.push({
          subtotal: sc.charge,
          gstPercent: sc.gstPercent
        });
      }

      const grossSubtotal = foodTotal + gamingTotal;

      if (grossSubtotal === 0) {
        throw new ValidationError('No unbilled orders or gaming sessions found to bill for this table', 'NOTHING_TO_BILL');
      }

      // 4. Line-by-line proportional discount & tax calculation
      let totalCgst = 0;
      let totalSgst = 0;

      for (const line of lines) {
        let lineAmount = line.subtotal;
        if (discountAmount > 0 && grossSubtotal > 0) {
          const lineDiscount = Math.round((line.subtotal / grossSubtotal) * discountAmount);
          lineAmount = Math.max(0, line.subtotal - lineDiscount);
        }
        const { cgst, sgst } = calculateLineAmounts(lineAmount, line.gstPercent, pricesIncludeTax);
        totalCgst += cgst;
        totalSgst += sgst;
      }

      const grandTotal = pricesIncludeTax
        ? Math.max(0, grossSubtotal - discountAmount)
        : Math.max(0, grossSubtotal - discountAmount) + totalCgst + totalSgst;

      // 5. Generate sequential integer invoice number & financial year
      const { invoiceNumber, financialYear } = await generateInvoiceNumber(tx, now);

      // Initial Payment Status
      const isAutoPay = Boolean(autoPayMethod);
      const initialPaymentStatus = isAutoPay ? 'PAID' : 'UNPAID';

      // 6. Create Bill record
      const bill = await tx.bill.create({
        data: {
          invoiceNumber,
          financialYear,
          tableId,
          staffId,
          customerId: customerId || table.orders?.[0]?.customerId || null,
          foodTotal,
          gamingTotal,
          cgstAmount: totalCgst,
          sgstAmount: totalSgst,
          discountAmount,
          discountReason: discountAmount > 0 ? (discountReason?.trim() || 'Staff Discount') : null,
          grandTotal,
          paymentStatus: initialPaymentStatus
        }
      });

      // 7. Update included orders to BILLED
      if (openOrders.length > 0) {
        await tx.order.updateMany({
          where: { id: { in: openOrders.map((o) => o.id) } },
          data: { billId: bill.id, status: 'BILLED' }
        });
      }

      // 8. Update included gaming sessions with billId
      if (unbilledSessions.length > 0) {
        await tx.gamingSession.updateMany({
          where: { id: { in: unbilledSessions.map((s) => s.id) } },
          data: { billId: bill.id }
        });
      }

      // Quick Full Payment Settlement if autoPayMethod selected
      if (isAutoPay) {
        await tx.payment.create({
          data: {
            billId: bill.id,
            amount: grandTotal,
            method: autoPayMethod,
            reference: 'Instant Quick Checkout Settlement',
            paidAt: now
          }
        });

        // Set table status to FREE
        await tx.table.update({
          where: { id: tableId },
          data: { status: 'FREE' }
        });
      }

      return bill;
    });

    const fullBill = await this.getBillById(createdBill.id);
    const updatedTable = await tableService.getTableById(tableId);

    broadcastBillCreated(fullBill);
    broadcastTableUpdate(updatedTable);

    return fullBill;
  },

  async voidBill(billId, staffId, { reason }) {
    const existingBill = await billingRepository.findBillById(billId);
    if (!existingBill) {
      throw new NotFoundError('Bill not found', 'BILL_NOT_FOUND');
    }

    if (existingBill.voidedAt) {
      throw new ConflictError('Bill is already voided', 'BILL_ALREADY_VOIDED');
    }

    if (!reason || !reason.trim()) {
      throw new ValidationError('A reason is mandatory when voiding a bill', 'VOID_REASON_REQUIRED');
    }

    await prisma.bill.update({
      where: { id: billId },
      data: {
        voidedAt: new Date(),
        voidReason: reason.trim(),
        voidedByStaffId: staffId
      }
    });

    const fullBill = await this.getBillById(billId);
    broadcastBillCreated(fullBill);

    return fullBill;
  },

  async addPayment(billId, { amount, method, reference }) {
    const existingBill = await billingRepository.findBillById(billId);
    if (!existingBill) {
      throw new NotFoundError('Bill not found', 'BILL_NOT_FOUND');
    }

    if (existingBill.voidedAt) {
      throw new ConflictError('Cannot add payment to a voided bill', 'BILL_VOIDED');
    }

    if (existingBill.paymentStatus === 'PAID') {
      throw new ConflictError('Bill is already fully paid', 'BILL_ALREADY_PAID');
    }

    // Atomic transaction for payment creation and status re-calculation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Payment
      const payment = await tx.payment.create({
        data: {
          billId,
          amount,
          method,
          reference: reference || null,
          paidAt: new Date()
        }
      });

      // 2. Fetch total paid so far
      const allPayments = await tx.payment.findMany({
        where: { billId }
      });
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

      // 3. Recompute paymentStatus
      let newStatus = 'UNPAID';
      if (totalPaid >= existingBill.grandTotal) {
        newStatus = 'PAID';
      } else if (totalPaid > 0) {
        newStatus = 'PARTIALLY_PAID';
      }

      // 4. Update Bill
      await tx.bill.update({
        where: { id: billId },
        data: { paymentStatus: newStatus }
      });

      // 5. If fully paid, check if table can be set back to FREE
      if (newStatus === 'PAID') {
        const remainingOpenOrders = await tx.order.count({
          where: { tableId: existingBill.tableId, status: 'OPEN' }
        });
        const remainingActiveSessions = await tx.gamingSession.count({
          where: { tableId: existingBill.tableId, status: 'ACTIVE' }
        });

        if (remainingOpenOrders === 0 && remainingActiveSessions === 0) {
          await tx.table.update({
            where: { id: existingBill.tableId },
            data: { status: 'FREE' }
          });
        }
      }

      return payment;
    });

    const fullBill = await this.getBillById(billId);
    const updatedTable = await tableService.getTableById(existingBill.tableId);

    // Non-blocking fire-and-forget SMS notification for paid bills with linked customer
    if (fullBill.paymentStatus === 'PAID' && fullBill.customer?.phone) {
      smsService.sendBillPaidSms({
        customerId: fullBill.customerId,
        phone: fullBill.customer.phone,
        billId: fullBill.id,
        grandTotal: fullBill.grandTotal,
        paymentMethod: method
      }).catch((smsErr) => {
        console.error('📱 Non-blocking SMS notification error:', smsErr.message);
      });
    }

    broadcastBillCreated(fullBill);
    broadcastTableUpdate(updatedTable);

    return fullBill;
  },

  async bulkSettleBills(billIds, { method = 'CASH', reference = 'Bulk Settlement' }) {
    const settledBills = [];
    for (const id of billIds) {
      try {
        const bill = await this.getBillById(id);
        if (bill && !bill.voidedAt && bill.paymentStatus !== 'PAID' && bill.remainingBalance > 0) {
          const updated = await this.addPayment(id, { amount: bill.remainingBalance, method, reference });
          settledBills.push(updated);
        }
      } catch (err) {
        console.warn(`Bulk settle skipped bill ${id}:`, err.message);
      }
    }
    return settledBills;
  },

  async updateBillCustomer(billId, customerId) {
    const existingBill = await billingRepository.findBillById(billId);
    if (!existingBill) {
      throw new NotFoundError('Bill not found', 'BILL_NOT_FOUND');
    }

    await prisma.bill.update({
      where: { id: billId },
      data: { customerId }
    });

    return this.getBillById(billId);
  }
};
