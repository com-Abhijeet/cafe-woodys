import { formatInvoiceNumber } from './invoiceFormat';

export function getCharsPerLine(profile = {}) {
  if (profile.thermalCharsPerLineOverride && Number(profile.thermalCharsPerLineOverride) > 0) {
    return Number(profile.thermalCharsPerLineOverride);
  }
  const widthMm = Number(profile.thermalPaperWidthMm) || (profile.thermalPaperWidth === 'MM_58' ? 58 : 80);
  return Math.max(16, Math.floor(widthMm * 0.6));
}

function padRight(str, len) {
  return (str + ' '.repeat(len)).slice(0, len);
}

function padLeft(str, len) {
  return (' '.repeat(len) + str).slice(-len);
}

function centerText(str, width) {
  if (!str) return '';
  if (str.length >= width) return str.slice(0, width);
  const leftPadding = Math.floor((width - str.length) / 2);
  return ' '.repeat(leftPadding) + str;
}

export function formatReceiptText(bill, options = {}) {
  const profile = options.businessProfile || bill.businessProfile || {};
  const width = options.width || getCharsPerLine(profile);

  const divider = '-'.repeat(width);
  const doubleDivider = '='.repeat(width);

  const lines = [];

  // Header: Business Profile
  lines.push(doubleDivider);
  const bName = (profile.businessName || "CAFÉ WOODY'S").toUpperCase();
  lines.push(centerText(bName, width));

  if (profile.address) {
    lines.push(centerText(profile.address, width));
  }
  if (profile.phone) {
    lines.push(centerText(`Ph: ${profile.phone}`, width));
  }
  if (profile.gstin) {
    lines.push(centerText(`GSTIN: ${profile.gstin}`, width));
  }
  if (profile.fssaiNumber) {
    lines.push(centerText(`FSSAI: ${profile.fssaiNumber}`, width));
  }
  lines.push(doubleDivider);

  // Invoice & Metadata
  const invoiceNo = typeof bill.invoiceNumber === 'number'
    ? formatInvoiceNumber(bill.invoiceNumber, bill.financialYear)
    : (bill.invoiceNumber || `Bill #${bill.id.slice(-6).toUpperCase()}`);
  const dateStr = bill.createdAt ? new Date(bill.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : new Date().toLocaleString();

  lines.push(`Invoice  : ${invoiceNo}`);
  lines.push(`Date     : ${dateStr}`);
  lines.push(`Table    : ${bill.table?.name || (bill.orderType === 'PARCEL' ? 'Parcel / Takeaway' : 'N/A')}`);
  if (bill.staff?.username) {
    lines.push(`Staff    : ${bill.staff.username}`);
  }
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

      const maxNameLen = Math.max(4, width - 8 - qtyStr.length);
      const truncatedName = nameStr.length > maxNameLen ? nameStr.slice(0, maxNameLen - 1) + '.' : nameStr;

      const leftPart = padRight(qtyStr + truncatedName, width - 8);
      lines.push(leftPart + padLeft(amountStr, 8));
    }
  }

  // Gaming Sessions Section
  const gamingSessions = bill.gamingSessions || [];
  if (gamingSessions.length > 0) {
    lines.push(divider);
    lines.push(padRight('PLAYER', 12) + padRight('TIME', 8) + padLeft('TOTAL', Math.max(8, width - 20)));
    lines.push(divider);

    for (const session of gamingSessions) {
      const pName = session.playerLabel || 'Player';
      const startTime = session.startTime ? new Date(session.startTime) : new Date();
      const endTime = session.endTime ? new Date(session.endTime) : new Date();
      const elapsedMins = Math.max(1, Math.ceil((endTime - startTime) / (1000 * 60)));
      const durationStr = `${elapsedMins}m`;

      const truncatedName = pName.length > 11 ? pName.slice(0, 10) + '.' : pName;
      const leftPart = padRight(truncatedName, 12) + padRight(durationStr, 8);
      lines.push(leftPart + padLeft(`₹${(session.halfHourRateSnapshot / 100).toFixed(0)}/30m`, Math.max(8, width - 20)));
    }
  }

  // Subtotal & Tax Breakdown Section
  lines.push(divider);
  const foodTotalPaise = bill.foodTotal || 0;
  const gamingTotalPaise = bill.gamingTotal || 0;
  const subtotalPaise = foodTotalPaise + gamingTotalPaise;

  lines.push(padRight('Subtotal:', Math.max(8, width - 10)) + padLeft(`₹${(subtotalPaise / 100).toFixed(2)}`, 10));

  if (bill.discountAmount > 0) {
    const reasonLabel = bill.discountReason ? ` (${bill.discountReason})` : '';
    const discountStr = `-₹${(bill.discountAmount / 100).toFixed(2)}`;
    lines.push(padRight(`Discount${reasonLabel}:`, Math.max(8, width - 10)) + padLeft(discountStr, 10));
  }

  const cgst = bill.cgstAmount || 0;
  const sgst = bill.sgstAmount || 0;

  lines.push(padRight('CGST:', Math.max(8, width - 10)) + padLeft(`₹${(cgst / 100).toFixed(2)}`, 10));
  lines.push(padRight('SGST:', Math.max(8, width - 10)) + padLeft(`₹${(sgst / 100).toFixed(2)}`, 10));

  lines.push(divider);
  lines.push(padRight('GRAND TOTAL:', Math.max(8, width - 10)) + padLeft(`₹${(bill.grandTotal / 100).toFixed(2)}`, 10));
  lines.push(divider);

  // Payments History
  if (bill.payments?.length > 0) {
    lines.push('PAID VIA:');
    for (const p of bill.payments) {
      const refStr = p.reference ? ` (${p.reference})` : '';
      const methodStr = `${p.method}${refStr}`;
      const amountStr = `₹${(p.amount / 100).toFixed(2)}`;
      lines.push(padRight(methodStr, Math.max(8, width - 10)) + padLeft(amountStr, 10));
    }
    lines.push(`Status: ${bill.paymentStatus}`);
    lines.push(divider);
  }

  // Footer Note
  const footerNote = profile.receiptFooterNote || 'Thank you for visiting Café Woody\'s!';
  lines.push(centerText(footerNote, width));
  lines.push(centerText('Please Come Again', width));
  lines.push(doubleDivider);

  return lines.join('\n');
}
