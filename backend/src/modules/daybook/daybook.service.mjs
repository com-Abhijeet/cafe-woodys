import { daybookRepository } from './daybook.repository.mjs';

function startOfDay(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(d) {
  const date = new Date(d);
  date.setHours(23, 59, 59, 999);
  return date;
}

function escapeCsvField(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export const daybookService = {
  async getSettings() {
    return daybookRepository.getSettings();
  },

  async updateSettings({ initialCashBalance }) {
    return daybookRepository.updateSettings({ initialCashBalance });
  },

  async addCashTransaction({ type, amount, reason, staffId }) {
    if (!type || !['CASH_IN', 'CASH_OUT'].includes(type)) {
      throw new Error('Type must be CASH_IN or CASH_OUT');
    }
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Amount must be a positive integer in paise');
    }
    if (!reason || !reason.trim()) {
      throw new Error('Reason is required for cash movements');
    }
    return daybookRepository.createCashTransaction({ type, amount, reason: reason.trim(), staffId });
  },

  async computeCashPosition(untilDate) {
    const settings = await daybookRepository.getSettings();
    const initial = settings.initialCashBalance || 0;

    const [payments, refunds, purchasePayments, cashTx] = await Promise.all([
      daybookRepository.getPaymentsBefore(untilDate),
      daybookRepository.getRefundsBefore(untilDate),
      daybookRepository.getPurchasePaymentsBefore(untilDate),
      daybookRepository.getCashTransactionsBefore(untilDate)
    ]);

    const cashPayments = payments.filter((p) => p.method === 'CASH').reduce((s, p) => s + p.amount, 0);
    const cashRefunds = refunds.filter((r) => r.method === 'CASH').reduce((s, r) => s + r.amount, 0);
    const cashPurchasePayments = purchasePayments.filter((p) => p.method === 'CASH').reduce((s, p) => s + p.amount, 0);

    const cashIn = cashTx.filter((t) => t.type === 'CASH_IN').reduce((s, t) => s + t.amount, 0);
    const cashOut = cashTx.filter((t) => t.type === 'CASH_OUT').reduce((s, t) => s + t.amount, 0);

    return initial + cashPayments + cashIn - (cashRefunds + cashPurchasePayments + cashOut);
  },

  async getDaybook(dateInput) {
    const targetDate = dateInput ? new Date(dateInput) : new Date();
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    const openingBalance = await this.computeCashPosition(dayStart);

    const [payments, refunds, purchasePayments, cashTx] = await Promise.all([
      daybookRepository.getPaymentsForRange(dayStart, dayEnd),
      daybookRepository.getRefundsForRange(dayStart, dayEnd),
      daybookRepository.getPurchasePaymentsForRange(dayStart, dayEnd),
      daybookRepository.getCashTransactionsForRange(dayStart, dayEnd)
    ]);

    // Build unified chronological row entries
    const entries = [];

    for (const p of payments) {
      if (p.method !== 'CASH') continue; // Daybook reconciles real cash-in-hand
      entries.push({
        id: `pay-${p.id}`,
        timestamp: p.paidAt,
        type: 'PAYMENT_IN',
        category: 'CASH_IN',
        amount: p.amount,
        description: `Bill #${p.bill.invoiceNumber} (${p.bill.customer?.name || 'Walk-in'})`,
        method: p.method,
        reference: p.reference || null,
        metadata: { billId: p.billId, invoiceNumber: p.bill.invoiceNumber }
      });
    }

    for (const r of refunds) {
      if (r.method !== 'CASH') continue;
      entries.push({
        id: `ref-${r.id}`,
        timestamp: r.createdAt,
        type: 'REFUND_OUT',
        category: 'CASH_OUT',
        amount: r.amount,
        description: `Refund on Bill #${r.bill.invoiceNumber}: ${r.reason}`,
        method: r.method,
        staff: r.staff?.username || null,
        metadata: { billId: r.billId }
      });
    }

    for (const pp of purchasePayments) {
      if (pp.method !== 'CASH') continue;
      entries.push({
        id: `pur-${pp.id}`,
        timestamp: pp.paidAt,
        type: 'PURCHASE_OUT',
        category: 'CASH_OUT',
        amount: pp.amount,
        description: `Purchase Payment (${pp.purchaseOrder?.supplier?.name || 'Supplier'})`,
        method: pp.method,
        reference: pp.reference || null,
        metadata: { purchaseOrderId: pp.purchaseOrderId }
      });
    }

    for (const ct of cashTx) {
      entries.push({
        id: `ctx-${ct.id}`,
        timestamp: ct.createdAt,
        type: ct.type,
        category: ct.type,
        amount: ct.amount,
        description: ct.reason,
        staff: ct.staff?.username || null,
        metadata: { staffId: ct.staffId }
      });
    }

    entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const totalIn = entries.filter((e) => e.category === 'CASH_IN').reduce((s, e) => s + e.amount, 0);
    const totalOut = entries.filter((e) => e.category === 'CASH_OUT').reduce((s, e) => s + e.amount, 0);
    const closingBalance = openingBalance + totalIn - totalOut;

    return {
      date: targetDate.toISOString().split('T')[0],
      openingBalance,
      totalIn,
      totalOut,
      closingBalance,
      entries
    };
  },

  async exportDaybookCsv({ dateFrom, dateTo }) {
    const start = dateFrom ? startOfDay(new Date(dateFrom)) : startOfDay(new Date());
    const end = dateTo ? endOfDay(new Date(dateTo)) : endOfDay(start);

    const openingBalance = await this.computeCashPosition(start);

    const [payments, refunds, purchasePayments, cashTx] = await Promise.all([
      daybookRepository.getPaymentsForRange(start, end),
      daybookRepository.getRefundsForRange(start, end),
      daybookRepository.getPurchasePaymentsForRange(start, end),
      daybookRepository.getCashTransactionsForRange(start, end)
    ]);

    const entries = [];

    for (const p of payments) {
      if (p.method !== 'CASH') continue;
      entries.push({
        timestamp: p.paidAt,
        type: 'Customer Payment (In)',
        cashIn: (p.amount / 100).toFixed(2),
        cashOut: '0.00',
        description: `Bill #${p.bill.invoiceNumber} (${p.bill.customer?.name || 'Walk-in'})`,
        staff: 'System'
      });
    }

    for (const r of refunds) {
      if (r.method !== 'CASH') continue;
      entries.push({
        timestamp: r.createdAt,
        type: 'Refund (Out)',
        cashIn: '0.00',
        cashOut: (r.amount / 100).toFixed(2),
        description: `Refund Bill #${r.bill.invoiceNumber}: ${r.reason}`,
        staff: r.staff?.username || ''
      });
    }

    for (const pp of purchasePayments) {
      if (pp.method !== 'CASH') continue;
      entries.push({
        timestamp: pp.paidAt,
        type: 'Supplier Payment (Out)',
        cashIn: '0.00',
        cashOut: (pp.amount / 100).toFixed(2),
        description: `Purchase Payment (${pp.purchaseOrder?.supplier?.name || 'Supplier'})`,
        staff: 'System'
      });
    }

    for (const ct of cashTx) {
      entries.push({
        timestamp: ct.createdAt,
        type: ct.type === 'CASH_IN' ? 'Manual Cash In' : 'Manual Cash Out',
        cashIn: ct.type === 'CASH_IN' ? (ct.amount / 100).toFixed(2) : '0.00',
        cashOut: ct.type === 'CASH_OUT' ? (ct.amount / 100).toFixed(2) : '0.00',
        description: ct.reason,
        staff: ct.staff?.username || ''
      });
    }

    entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const headers = ['Date & Time', 'Transaction Type', 'Cash In (Rs)', 'Cash Out (Rs)', 'Description', 'Staff'];
    const rows = [headers.join(',')];

    rows.push([
      escapeCsvField(new Date(start).toLocaleDateString()),
      escapeCsvField('OPENING BALANCE'),
      (openingBalance / 100).toFixed(2),
      '0.00',
      escapeCsvField('Daybook Opening Cash Balance'),
      ''
    ].join(','));

    for (const e of entries) {
      const row = [
        escapeCsvField(new Date(e.timestamp).toLocaleString()),
        escapeCsvField(e.type),
        e.cashIn,
        e.cashOut,
        escapeCsvField(e.description),
        escapeCsvField(e.staff)
      ];
      rows.push(row.join(','));
    }

    return rows.join('\r\n');
  }
};
