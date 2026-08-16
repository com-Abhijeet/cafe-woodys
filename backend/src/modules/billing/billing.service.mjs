import prisma from '../../shared/db/client.mjs';
import { billingRepository } from './billing.repository.mjs';
import { tableService } from '../table/table.service.mjs';
import { calculateSlotCharge } from '../gaming-session/gaming-session.service.mjs';
import { smsService } from '../sms/sms.service.mjs';
import { broadcastBillCreated, broadcastTableUpdate } from '../../realtime/broadcast.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';
import { ConflictError } from '../../shared/errors/conflict-error.mjs';

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

  async generateBill(tableId, staffId, { discountAmount = 0, taxAmount = 0, customerId = null }) {
    const table = await tableService.getTableById(tableId);
    if (!table) {
      throw new NotFoundError('Table not found', 'TABLE_NOT_FOUND');
    }

    if (table.status === 'billing_in_progress') {
      throw new ConflictError('Billing checkout is already in progress for this table. Please wait.', 'BILLING_IN_PROGRESS');
    }

    const now = new Date();

    // Execute checkout in single atomic database transaction
    const createdBill = await prisma.$transaction(async (tx) => {
      // Step 0: Lock table status to billing_in_progress to block double-taps
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

      // Auto-close any active sessions
      const sessionChargesMap = new Map();
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
          session.maxChargeCap
        );
        sessionChargesMap.set(session.id, charge);
      }

      // 3. Compute totals
      const foodTotal = openOrders.reduce((sum, order) => {
        const orderSum = order.items.reduce((iSum, item) => iSum + (item.priceSnapshot * item.quantity), 0);
        return sum + orderSum;
      }, 0);

      const gamingTotal = Array.from(sessionChargesMap.values()).reduce((sum, c) => sum + c, 0);

      if (foodTotal === 0 && gamingTotal === 0) {
        throw new ValidationError('No unbilled orders or gaming sessions found to bill for this table', 'NOTHING_TO_BILL');
      }

      const grandTotal = Math.max(0, foodTotal + gamingTotal + taxAmount - discountAmount);

      // 4. Create Bill record
      const bill = await tx.bill.create({
        data: {
          tableId,
          staffId,
          customerId: customerId || table.orders?.[0]?.customerId || null,
          foodTotal,
          gamingTotal,
          taxAmount,
          discountAmount,
          grandTotal,
          paymentStatus: 'UNPAID'
        }
      });

      // 5. Update included orders to BILLED
      if (openOrders.length > 0) {
        await tx.order.updateMany({
          where: { id: { in: openOrders.map((o) => o.id) } },
          data: { billId: bill.id, status: 'BILLED' }
        });
      }

      // 6. Update included gaming sessions with billId
      if (unbilledSessions.length > 0) {
        await tx.gamingSession.updateMany({
          where: { id: { in: unbilledSessions.map((s) => s.id) } },
          data: { billId: bill.id }
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

  async addPayment(billId, { amount, method, reference }) {
    const existingBill = await billingRepository.findBillById(billId);
    if (!existingBill) {
      throw new NotFoundError('Bill not found', 'BILL_NOT_FOUND');
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
