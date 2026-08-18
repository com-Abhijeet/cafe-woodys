import prisma from '../../shared/db/client.mjs';

function escapeCsvField(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export const exportService = {
  async exportBillsCsv({ dateFrom, dateTo }) {
    const where = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const bills = await prisma.bill.findMany({
      where,
      include: {
        table: { select: { name: true } },
        customer: { select: { name: true, phone: true } },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const headers = [
      'Invoice Number',
      'Financial Year',
      'Date & Time',
      'Table',
      'Customer Name',
      'Customer Phone',
      'Food Total (Rs)',
      'Gaming Total (Rs)',
      'Discount (Rs)',
      'CGST (Rs)',
      'SGST (Rs)',
      'Grand Total (Rs)',
      'Payment Status',
      'Payment Method(s)'
    ];

    const rows = [headers.join(',')];

    for (const bill of bills) {
      const methods = Array.from(new Set(bill.payments.map((p) => p.method))).join(' + ') || 'Unpaid';
      const row = [
        escapeCsvField(`Invoice #${bill.invoiceNumber}`),
        escapeCsvField(bill.financialYear),
        escapeCsvField(new Date(bill.createdAt).toLocaleString()),
        escapeCsvField(bill.table?.name || 'N/A'),
        escapeCsvField(bill.customer?.name || 'Walk-in'),
        escapeCsvField(bill.customer?.phone || ''),
        (bill.foodTotal / 100).toFixed(2),
        (bill.gamingTotal / 100).toFixed(2),
        (bill.discountAmount / 100).toFixed(2),
        (bill.cgstAmount / 100).toFixed(2),
        (bill.sgstAmount / 100).toFixed(2),
        (bill.grandTotal / 100).toFixed(2),
        escapeCsvField(bill.paymentStatus),
        escapeCsvField(methods)
      ];
      rows.push(row.join(','));
    }

    return rows.join('\r\n');
  },

  async exportPurchasesCsv({ dateFrom, dateTo }) {
    const where = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const purchases = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        staff: { select: { username: true } },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const headers = [
      'PO Number',
      'Date & Time',
      'Supplier Name',
      'Created By Staff',
      'PO Status',
      'Subtotal (Rs)',
      'Tax (Rs)',
      'Grand Total (Rs)',
      'Paid Amount (Rs)',
      'Payment Method(s)'
    ];

    const rows = [headers.join(',')];

    for (const po of purchases) {
      const totalPaid = po.payments.reduce((sum, p) => sum + p.amount, 0);
      const methods = Array.from(new Set(po.payments.map((p) => p.method))).join(' + ') || 'Unpaid';
      const row = [
        escapeCsvField(po.poNumber),
        escapeCsvField(new Date(po.createdAt).toLocaleString()),
        escapeCsvField(po.supplier?.name || 'N/A'),
        escapeCsvField(po.staff?.username || 'N/A'),
        escapeCsvField(po.status),
        (po.subtotal / 100).toFixed(2),
        (po.taxAmount / 100).toFixed(2),
        (po.grandTotal / 100).toFixed(2),
        (totalPaid / 100).toFixed(2),
        escapeCsvField(methods)
      ];
      rows.push(row.join(','));
    }

    return rows.join('\r\n');
  }
};
