import { customerRepository } from './customer.repository.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';

function formatCustomerProfile(customer) {
  if (!customer) return null;

  const paidBills = (customer.bills || []).filter((b) => b.paymentStatus === 'PAID');
  const totalSpendPaise = paidBills.reduce((sum, b) => sum + b.grandTotal, 0);
  const visitCount = customer.bills ? customer.bills.length : (customer._count?.bills || 0);

  return {
    ...customer,
    totalSpendPaise,
    visitCount
  };
}

export const customerService = {
  async searchCustomers(query) {
    const customers = await customerRepository.search(query);
    return customers.map(formatCustomerProfile);
  },

  async getCustomerById(id) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundError('Customer not found', 'CUSTOMER_NOT_FOUND');
    }
    return formatCustomerProfile(customer);
  },

  async createCustomer(data) {
    const created = await customerRepository.create(data);
    return formatCustomerProfile(created);
  },

  async updateCustomer(id, data) {
    const existing = await customerRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Customer not found', 'CUSTOMER_NOT_FOUND');
    }
    const updated = await customerRepository.update(id, data);
    return formatCustomerProfile(updated);
  },

  async getCustomerBalances({ sort = 'balance' } = {}) {
    const customers = await customerRepository.search('');
    const fullCustomers = await Promise.all(
      customers.map((c) => customerRepository.findById(c.id))
    );

    const result = fullCustomers.map((c) => {
      const validBills = (c.bills || []).filter((b) => !b.voidedAt);
      const totalBilled = validBills.reduce((s, b) => s + b.grandTotal, 0);
      const totalPaid = validBills.reduce((s, b) => {
        const pSum = (b.payments || []).reduce((ps, p) => ps + p.amount, 0);
        return s + pSum;
      }, 0);

      const outstandingBalance = Math.max(0, totalBilled - totalPaid);
      return {
        customerId: c.id,
        name: c.name,
        phone: c.phone,
        notes: c.notes,
        totalBilled,
        totalPaid,
        outstandingBalance,
        createdAt: c.createdAt
      };
    });

    if (sort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => b.outstandingBalance - a.outstandingBalance);
    }

    return result;
  },

  async getCustomerLedger(id) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundError('Customer not found', 'CUSTOMER_NOT_FOUND');
    }

    const validBills = (customer.bills || []).filter((b) => !b.voidedAt);

    const rawEntries = [];
    for (const b of validBills) {
      rawEntries.push({
        id: `bill-${b.id}`,
        timestamp: b.createdAt,
        type: 'BILL',
        reference: `Bill #${b.invoiceNumber} (${b.financialYear})`,
        debit: b.grandTotal, // Billed amount increases customer debt
        credit: 0,
        metadata: { billId: b.id, invoiceNumber: b.invoiceNumber }
      });

      for (const p of b.payments || []) {
        rawEntries.push({
          id: `pay-${p.id}`,
          timestamp: p.paidAt || p.createdAt,
          type: 'PAYMENT',
          reference: `Payment (${p.method})${p.reference ? ` - ${p.reference}` : ''}`,
          debit: 0,
          credit: p.amount, // Payment reduces debt
          metadata: { paymentId: p.id, billId: b.id, method: p.method }
        });
      }
    }

    rawEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let runningBalance = 0;
    const ledgerEntries = rawEntries.map((e) => {
      runningBalance += e.debit - e.credit;
      return {
        ...e,
        balanceAfter: runningBalance
      };
    });

    const totalBilled = validBills.reduce((s, b) => s + b.grandTotal, 0);
    const totalPaid = validBills.reduce((s, b) => {
      return s + (b.payments || []).reduce((ps, p) => ps + p.amount, 0);
    }, 0);

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        notes: customer.notes
      },
      totalBilled,
      totalPaid,
      outstandingBalance: Math.max(0, totalBilled - totalPaid),
      entries: ledgerEntries
    };
  },

  async exportCustomerLedgerCsv(id) {
    const ledger = await this.getCustomerLedger(id);
    const headers = ['Date & Time', 'Transaction Type', 'Reference', 'Debit / Billed (Rs)', 'Credit / Paid (Rs)', 'Running Balance (Rs)'];
    const rows = [headers.join(',')];

    for (const e of ledger.entries) {
      const str = [
        `"${new Date(e.timestamp).toLocaleString()}"`,
        `"${e.type}"`,
        `"${e.reference.replace(/"/g, '""')}"`,
        (e.debit / 100).toFixed(2),
        (e.credit / 100).toFixed(2),
        (e.balanceAfter / 100).toFixed(2)
      ];
      rows.push(str.join(','));
    }

    return rows.join('\r\n');
  }
};
