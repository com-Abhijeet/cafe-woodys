function padRight(str, len) {
  return (str + ' '.repeat(len)).slice(0, len);
}

function padLeft(str, len) {
  return (' '.repeat(len) + str).slice(-len);
}

export function formatReceiptText(bill, options = {}) {
  const width = options.width || 32; // 32 chars for 58mm, 48 chars for 80mm
  const divider = '-'.repeat(width);
  const doubleDivider = '='.repeat(width);

  const lines = [];

  // Header
  lines.push(doubleDivider);
  lines.push(padLeft('CAFÉ WOODY\'S', Math.floor((width + 'CAFÉ WOODY\'S'.length) / 2)));
  lines.push(padLeft('POS & Gaming Zone', Math.floor((width + 'POS & Gaming Zone'.length) / 2)));
  lines.push(doubleDivider);

  // Metadata
  const billNo = bill.id ? bill.id.slice(-8).toUpperCase() : 'N/A';
  const dateStr = bill.createdAt ? new Date(bill.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : new Date().toLocaleString();
  
  lines.push(`Receipt #: ${billNo}`);
  lines.push(`Date     : ${dateStr}`);
  lines.push(`Table    : ${bill.table?.name || 'N/A'}`);
  lines.push(`Staff    : ${bill.staff?.username || 'Staff'}`);
  if (bill.customer?.name) {
    lines.push(`Customer : ${bill.customer.name} (${bill.customer.phone || ''})`);
  }

  // Food Items Section
  const foodItems = (bill.orders || []).flatMap((o) => o.items || []);
  if (foodItems.length > 0) {
    lines.push(divider);
    lines.push(padRight('QTY ITEM', width - 8) + padLeft('AMOUNT', 8));
    lines.push(divider);

    for (const item of foodItems) {
      const qtyStr = `${item.quantity}x `;
      const nameStr = item.menuItem?.name || 'Food Item';
      const amountStr = `₹${((item.priceSnapshot * item.quantity) / 100).toFixed(2)}`;

      const maxNameLen = width - 8 - qtyStr.length;
      const truncatedName = nameStr.length > maxNameLen ? nameStr.slice(0, maxNameLen - 1) + '.' : nameStr;

      const leftPart = padRight(qtyStr + truncatedName, width - 8);
      lines.push(leftPart + padLeft(amountStr, 8));
    }
  }

  // Gaming Sessions Section
  const gamingSessions = bill.gamingSessions || [];
  if (gamingSessions.length > 0) {
    lines.push(divider);
    lines.push(padRight('PLAYER', 12) + padRight('TIME', 8) + padLeft('TOTAL', width - 20));
    lines.push(divider);

    for (const session of gamingSessions) {
      const pName = session.playerLabel || 'Player';
      const startTime = session.startTime ? new Date(session.startTime) : new Date();
      const endTime = session.endTime ? new Date(session.endTime) : new Date();
      const elapsedMins = Math.max(1, Math.ceil((endTime - startTime) / (1000 * 60)));
      const durationStr = `${elapsedMins}m`;

      const truncatedName = pName.length > 11 ? pName.slice(0, 10) + '.' : pName;
      const leftPart = padRight(truncatedName, 12) + padRight(durationStr, 8);
      lines.push(leftPart + padLeft(`₹${(session.halfHourRateSnapshot / 100).toFixed(0)}/30m`, width - 20));
    }
  }

  // Totals Section
  lines.push(divider);
  lines.push(padRight('Food Subtotal:', width - 10) + padLeft(`₹${(bill.foodTotal / 100).toFixed(2)}`, 10));
  lines.push(padRight('Gaming Subtotal:', width - 10) + padLeft(`₹${(bill.gamingTotal / 100).toFixed(2)}`, 10));
  
  if (bill.taxAmount > 0) {
    lines.push(padRight('Tax:', width - 10) + padLeft(`₹${(bill.taxAmount / 100).toFixed(2)}`, 10));
  }
  if (bill.discountAmount > 0) {
    lines.push(padRight('Discount:', width - 10) + padLeft(`-₹${(bill.discountAmount / 100).toFixed(2)}`, 10));
  }

  lines.push(divider);
  lines.push(padRight('GRAND TOTAL:', width - 10) + padLeft(`₹${(bill.grandTotal / 100).toFixed(2)}`, 10));
  lines.push(divider);

  // Payments History
  if (bill.payments?.length > 0) {
    lines.push('PAYMENTS RECORDED:');
    for (const p of bill.payments) {
      const refStr = p.reference ? ` (${p.reference})` : '';
      const methodStr = `${p.method}${refStr}`;
      const amountStr = `₹${(p.amount / 100).toFixed(2)}`;
      lines.push(padRight(methodStr, width - 10) + padLeft(amountStr, 10));
    }
    lines.push(`Status: ${bill.paymentStatus}`);
    lines.push(divider);
  }

  // Footer
  lines.push(padLeft('Thank you for visiting!', Math.floor((width + 'Thank you for visiting!'.length) / 2)));
  lines.push(padLeft('Please Come Again', Math.floor((width + 'Please Come Again'.length) / 2)));
  lines.push(doubleDivider);

  return lines.join('\n');
}
