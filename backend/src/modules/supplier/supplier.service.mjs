import { supplierRepository } from './supplier.repository.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';

export const supplierService = {
  async listSuppliers() {
    return supplierRepository.findAll();
  },

  async getSupplierById(id) {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new NotFoundError('Supplier not found', 'SUPPLIER_NOT_FOUND');
    }
    return supplier;
  },

  async createSupplier(data) {
    return supplierRepository.create(data);
  },

  async updateSupplier(id, data) {
    const existing = await supplierRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Supplier not found', 'SUPPLIER_NOT_FOUND');
    }
    return supplierRepository.update(id, data);
  },

  async deleteSupplier(id) {
    const existing = await supplierRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Supplier not found', 'SUPPLIER_NOT_FOUND');
    }
    return supplierRepository.delete(id);
  },

  async getSupplierBalances({ sort = 'balance' } = {}) {
    const suppliers = await supplierRepository.findAll();
    const fullSuppliers = await Promise.all(
      suppliers.map((s) => supplierRepository.findWithAllOrders(s.id))
    );

    const result = fullSuppliers.map((s) => {
      const orders = s?.purchaseOrders || [];
      const totalOrdered = orders.reduce((sum, po) => sum + po.totalCost, 0);
      const totalPaid = orders.reduce((sum, po) => {
        return sum + (po.payments || []).reduce((ps, p) => ps + p.amount, 0);
      }, 0);

      const outstandingBalance = Math.max(0, totalOrdered - totalPaid);
      return {
        supplierId: s.id,
        name: s.name,
        phone: s.phone,
        address: s.address,
        totalOrdered,
        totalPaid,
        outstandingBalance,
        createdAt: s.createdAt
      };
    });

    if (sort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => b.outstandingBalance - a.outstandingBalance);
    }

    return result;
  },

  async getSupplierLedger(id) {
    const supplier = await supplierRepository.findWithAllOrders(id);
    if (!supplier) {
      throw new NotFoundError('Supplier not found', 'SUPPLIER_NOT_FOUND');
    }

    const orders = supplier.purchaseOrders || [];
    const rawEntries = [];

    for (const po of orders) {
      rawEntries.push({
        id: `po-${po.id}`,
        timestamp: po.purchaseDate || po.createdAt,
        type: 'PURCHASE_ORDER',
        reference: `PO ID: ${po.id.slice(0, 8)}`,
        debit: po.totalCost, // Purchase order increases amount we owe supplier
        credit: 0,
        metadata: { purchaseOrderId: po.id }
      });

      for (const p of po.payments || []) {
        rawEntries.push({
          id: `ppay-${p.id}`,
          timestamp: p.paidAt || p.createdAt,
          type: 'PURCHASE_PAYMENT',
          reference: `Payment (${p.method})${p.reference ? ` - ${p.reference}` : ''}`,
          debit: 0,
          credit: p.amount, // Payment reduces amount owed
          metadata: { paymentId: p.id, purchaseOrderId: po.id, method: p.method }
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

    const totalOrdered = orders.reduce((s, po) => s + po.totalCost, 0);
    const totalPaid = orders.reduce((s, po) => {
      return s + (po.payments || []).reduce((ps, p) => ps + p.amount, 0);
    }, 0);

    return {
      supplier: {
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        address: supplier.address
      },
      totalOrdered,
      totalPaid,
      outstandingBalance: Math.max(0, totalOrdered - totalPaid),
      entries: ledgerEntries
    };
  },

  async exportSupplierLedgerCsv(id) {
    const ledger = await this.getSupplierLedger(id);
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
