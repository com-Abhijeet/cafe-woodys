// Cafe Woody's — Receipt Formatter for Thermal Printing

export function formatReceipt(bill) {
  if (!bill) return '';

  const dateStr = new Date(bill.createdAt || Date.now()).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const invoiceNo = typeof bill.invoiceNumber === 'number'
    ? `Invoice #${bill.invoiceNumber} (${bill.financialYear || ''})`
    : (bill.invoiceNumber || `Bill #${bill.id.slice(-6).toUpperCase()}`);

  const lines = [];
  lines.push('================================');
  lines.push('        CAFE WOODY\'S           ');
  lines.push('  Gaming Zone & Specialty Cafe  ');
  lines.push('================================');
  lines.push(`Date: ${dateStr}`);
  lines.push(`${invoiceNo}`);
  lines.push(`Table: ${bill.table?.name || 'Table'} (${bill.table?.zone?.name || 'Zone'})`);
  if (bill.customer) {
    lines.push(`Customer: ${bill.customer.name} (${bill.customer.phone})`);
  }
  lines.push('--------------------------------');
  lines.push('ITEM               QTY    PRICE ');
  lines.push('--------------------------------');

  // 1. Food Orders Line Items
  if (bill.orders?.length > 0) {
    bill.orders.forEach((ord) => {
      ord.items?.forEach((i) => {
        const name = (i.menuItem?.name || 'Item').padEnd(18).slice(0, 18);
        const qty = String(i.quantity).padStart(3);
        const amt = `₹${((i.priceSnapshot * i.quantity) / 100).toFixed(2)}`.padStart(9);
        lines.push(`${name} ${qty} ${amt}`);
      });
    });
  }

  // 2. Gaming Sessions Line Items
  if (bill.gamingSessions?.length > 0) {
    bill.gamingSessions.forEach((s) => {
      const name = `Play: ${s.playerLabel || 'Player'}`.padEnd(18).slice(0, 18);
      const amt = `₹${((s.hourlyRateSnapshot || 0) / 100).toFixed(2)}`.padStart(13);
      lines.push(`${name}    ${amt}`);
    });
  }

  lines.push('--------------------------------');
  lines.push(`Food Subtotal:      ₹${((bill.foodTotal || 0) / 100).toFixed(2)}`);
  if (bill.gamingTotal > 0) {
    lines.push(`Gaming Subtotal:    ₹${((bill.gamingTotal || 0) / 100).toFixed(2)}`);
  }
  if (bill.discountAmount > 0) {
    lines.push(`Discount:          -₹${((bill.discountAmount || 0) / 100).toFixed(2)}`);
  }
  lines.push(`CGST:               ₹${((bill.cgstAmount || 0) / 100).toFixed(2)}`);
  lines.push(`SGST:               ₹${((bill.sgstAmount || 0) / 100).toFixed(2)}`);
  lines.push('================================');
  lines.push(`GRAND TOTAL:        ₹${((bill.grandTotal || 0) / 100).toFixed(2)}`);
  lines.push(`Paid:               ₹${((bill.totalPaid || 0) / 100).toFixed(2)}`);
  lines.push(`Balance Due:        ₹${((bill.remainingBalance || 0) / 100).toFixed(2)}`);
  lines.push('================================');
  lines.push('  Thank you for visiting Woody\'s!');
  lines.push('       Please Come Again!       ');
  lines.push('\n\n\n'); // Feed spacing for tear

  return lines.join('\n');
}
