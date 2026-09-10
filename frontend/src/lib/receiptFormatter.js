import { formatInvoiceNumber } from './invoiceFormat';

export function sanitizeThermalText(text) {
  if (!text) return '';
  return text
    .replace(/₹\s*/g, 'Rs.')
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u00A0/g, ' ');
}

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

export function formatReceiptText(bill = {}, options = {}) {
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
  const billIdStr = bill.id ? bill.id.slice(-6).toUpperCase() : 'DRAFT';
  const invoiceNo = typeof bill.invoiceNumber === 'number'
    ? formatInvoiceNumber(bill.invoiceNumber, bill.financialYear)
    : (bill.invoiceNumber || `Bill #${billIdStr}`);
  const dateStr = bill.createdAt ? new Date(bill.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : new Date().toLocaleString();

  lines.push(`Invoice  : ${invoiceNo}`);
  lines.push(`Date     : ${dateStr}`);
  lines.push(`Table    : ${bill.table?.name || (bill.orderType === 'PARCEL' || !bill.table ? 'Parcel / Takeaway' : 'N/A')}`);
  if (bill.staff?.username) {
    lines.push(`Staff    : ${bill.staff.username}`);
  }
  if (bill.customer?.name) {
    lines.push(`Customer : ${bill.customer.name} (${bill.customer.phone || ''})`);
  }

  // Food Items Section
  const foodItems = (bill.orders && bill.orders.length > 0)
    ? bill.orders.flatMap((o) => o.items || [])
    : (bill.items || []);

  if (foodItems.length > 0) {
    lines.push(divider);
    lines.push(padRight('QTY ITEM', width - 8) + padLeft('AMOUNT', 8));
    lines.push(divider);

    for (const item of foodItems) {
      if (item.voidedAt) continue;
      const qtyStr = `${item.quantity}x `;
      const nameStr = item.menuItem?.name || 'Food Item';
      const itemPrice = item.priceSnapshot || item.menuItem?.price || 0;
      const amountStr = `₹${((itemPrice * item.quantity) / 100).toFixed(2)}`;

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
      lines.push(leftPart + padLeft(`₹${((session.halfHourRateSnapshot || 0) / 100).toFixed(0)}/30m`, Math.max(8, width - 20)));
    }
  }

  // Subtotal & Tax Breakdown Section
  lines.push(divider);
  const foodTotalPaise = typeof bill.foodTotal === 'number'
    ? bill.foodTotal
    : foodItems.filter((i) => !i.voidedAt).reduce((sum, i) => sum + ((i.priceSnapshot || i.menuItem?.price || 0) * i.quantity), 0);

  const gamingTotalPaise = typeof bill.gamingTotal === 'number' ? bill.gamingTotal : 0;
  const subtotalPaise = foodTotalPaise + gamingTotalPaise;

  lines.push(padRight('Subtotal:', Math.max(8, width - 10)) + padLeft(`₹${(subtotalPaise / 100).toFixed(2)}`, 10));

  const discountAmount = bill.discountAmount || 0;
  if (discountAmount > 0) {
    const reasonLabel = bill.discountReason ? ` (${bill.discountReason})` : '';
    const discountStr = `-₹${(discountAmount / 100).toFixed(2)}`;
    lines.push(padRight(`Discount${reasonLabel}:`, Math.max(8, width - 10)) + padLeft(discountStr, 10));
  }

  const cgst = bill.cgstAmount || 0;
  const sgst = bill.sgstAmount || 0;

  lines.push(padRight('CGST:', Math.max(8, width - 10)) + padLeft(`₹${(cgst / 100).toFixed(2)}`, 10));
  lines.push(padRight('SGST:', Math.max(8, width - 10)) + padLeft(`₹${(sgst / 100).toFixed(2)}`, 10));

  const grandTotalPaise = typeof bill.grandTotal === 'number'
    ? bill.grandTotal
    : Math.max(0, subtotalPaise - discountAmount + cgst + sgst);

  lines.push(divider);
  lines.push(padRight('GRAND TOTAL:', Math.max(8, width - 10)) + padLeft(`₹${(grandTotalPaise / 100).toFixed(2)}`, 10));
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
    lines.push(`Status: ${bill.paymentStatus || 'PAID'}`);
    lines.push(divider);
  }

  // Footer Note
  const footerNote = profile.receiptFooterNote || 'Thank you for visiting Café Woody\'s!';
  lines.push(centerText(footerNote, width));
  lines.push(centerText('Please Come Again', width));
  lines.push(doubleDivider);

  return sanitizeThermalText(lines.join('\n'));
}

// Phase 20 Step 5: Shared Kitchen Slip Formatter (No prices, no GST, no payment info, no icons)
export function formatKitchenSlipText(orderOrBill = {}, options = {}) {
  const width = options.width || 32;
  const divider = '-'.repeat(width);
  const doubleDivider = '='.repeat(width);

  const lines = [];

  const dailyNum = orderOrBill.dailyOrderNumber || orderOrBill.invoiceNumber || 'N/A';
  lines.push(doubleDivider);
  lines.push(centerText(`Order #${dailyNum}`, width));

  const isParcel = orderOrBill.orderType === 'PARCEL' || !orderOrBill.table;
  const locationText = isParcel
    ? 'TAKEAWAY'
    : `DINE-IN · ${orderOrBill.table?.name || 'Table'}`;
  lines.push(centerText(locationText, width));
  lines.push(doubleDivider);

  // Extract non-voided items
  let items = orderOrBill.items || [];
  if (!items.length && orderOrBill.orders) {
    items = orderOrBill.orders.flatMap((o) => o.items || []);
  }

  const activeItems = items.filter((i) => !i.voidedAt);

  for (const item of activeItems) {
    const qtyStr = `${item.quantity}x `;
    const nameStr = item.menuItem?.name || 'Item';
    lines.push(`${qtyStr}${nameStr}`);
  }

  lines.push(divider);
  lines.push(centerText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), width));
  lines.push(doubleDivider);

  return sanitizeThermalText(lines.join('\n'));
}
