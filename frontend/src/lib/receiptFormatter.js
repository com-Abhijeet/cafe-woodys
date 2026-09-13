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

export function getCharsPerLine(configOrProfile = {}, options = {}) {
  const printerConfig = options.printerConfig || configOrProfile;
  if (printerConfig.charsPerLineOverride && Number(printerConfig.charsPerLineOverride) > 0) {
    return Number(printerConfig.charsPerLineOverride);
  }
  if (printerConfig.thermalCharsPerLineOverride && Number(printerConfig.thermalCharsPerLineOverride) > 0) {
    return Number(printerConfig.thermalCharsPerLineOverride);
  }
  if (printerConfig.charsPerLine && Number(printerConfig.charsPerLine) > 0) {
    return Number(printerConfig.charsPerLine);
  }

  const widthMm = Number(printerConfig.paperWidthMm || printerConfig.thermalPaperWidthMm) || 
                  (printerConfig.thermalPaperWidth === 'MM_58' ? 58 : 80);

  // 58mm paper roll -> 32 chars/line
  // 80mm paper roll -> 48 chars/line (Font A standard as per printer self-test)
  return widthMm <= 58 ? 32 : 48;
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
  const printerConfig = options.printerConfig || {};
  const width = options.width || getCharsPerLine(printerConfig, { businessProfile: profile });

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

  const amountColWidth = 12; // Reserves up to 12 chars e.g. "Rs.999999.00"

  if (foodItems.length > 0) {
    lines.push(divider);
    lines.push(padRight('QTY ITEM', width - amountColWidth) + padLeft('AMOUNT', amountColWidth));
    lines.push(divider);

    for (const item of foodItems) {
      if (item.voidedAt) continue;
      const qtyStr = `${item.quantity}x `;
      const nameStr = item.menuItem?.name || 'Food Item';
      const itemPrice = item.priceSnapshot || item.menuItem?.price || 0;
      const amountStr = `Rs.${((itemPrice * item.quantity) / 100).toFixed(2)}`;

      const maxNameLen = Math.max(4, width - amountColWidth - qtyStr.length);
      const truncatedName = nameStr.length > maxNameLen ? nameStr.slice(0, maxNameLen - 1) + '.' : nameStr;

      const leftPart = padRight(qtyStr + truncatedName, width - amountColWidth);
      lines.push(leftPart + padLeft(amountStr, amountColWidth));
    }
  }

  // Gaming Sessions Section
  const gamingSessions = (bill.gamingSessions && bill.gamingSessions.length > 0)
    ? bill.gamingSessions
    : ((bill.table?.gamingSessions && bill.table.gamingSessions.length > 0)
        ? bill.table.gamingSessions
        : []);

  const gamingTotalPaise = typeof bill.gamingTotal === 'number' ? bill.gamingTotal : 0;

  if (gamingSessions.length > 0) {
    lines.push(divider);
    const playerWidth = Math.max(8, width - amountColWidth - 6);
    lines.push(padRight('PLAYER', playerWidth) + padRight('TIME', 6) + padLeft('TOTAL', amountColWidth));
    lines.push(divider);

    for (const session of gamingSessions) {
      const pName = session.playerLabel || 'Player';
      const startTime = session.startTime ? new Date(session.startTime) : new Date();
      const endTime = session.endTime ? new Date(session.endTime) : (session.status === 'ACTIVE' ? new Date() : startTime);
      let elapsedMins = session.elapsedMinutes || Math.max(1, Math.ceil((endTime - startTime) / (1000 * 60)));
      const chargePaise = session.calculatedCharge ?? (() => {
        const graceMinutes = 5;
        const remainder = elapsedMins % 30;
        if (remainder > 0 && remainder <= graceMinutes) elapsedMins -= remainder;
        const fullHours = Math.floor(elapsedMins / 60);
        const remMinutes = elapsedMins % 60;
        let chg = fullHours * (session.hourlyRateSnapshot || 0);
        if (remMinutes > 0) chg += remMinutes <= 30 ? (session.halfHourRateSnapshot || 0) : (session.hourlyRateSnapshot || 0);
        if (session.maxChargeCap && session.maxChargeCap > 0) chg = Math.min(chg, session.maxChargeCap);
        return chg;
      })();

      const durationStr = `${elapsedMins}m`;
      const truncatedName = pName.length > playerWidth - 1 ? pName.slice(0, playerWidth - 2) + '.' : pName;
      const leftPart = padRight(truncatedName, playerWidth) + padRight(durationStr, 6);
      lines.push(leftPart + padLeft(`Rs.${(chargePaise / 100).toFixed(2)}`, amountColWidth));
    }
  } else if (gamingTotalPaise > 0) {
    lines.push(divider);
    lines.push(padRight('Gaming Charge:', width - amountColWidth) + padLeft(`Rs.${(gamingTotalPaise / 100).toFixed(2)}`, amountColWidth));
  }

  // Subtotal & Tax Breakdown Section
  lines.push(divider);
  const foodTotalPaise = typeof bill.foodTotal === 'number'
    ? bill.foodTotal
    : foodItems.filter((i) => !i.voidedAt).reduce((sum, i) => sum + ((i.priceSnapshot || i.menuItem?.price || 0) * i.quantity), 0);

  const subtotalPaise = foodTotalPaise + gamingTotalPaise;

  lines.push(padRight('Subtotal:', width - amountColWidth) + padLeft(`Rs.${(subtotalPaise / 100).toFixed(2)}`, amountColWidth));

  const discountAmount = bill.discountAmount || 0;
  if (discountAmount > 0) {
    const reasonLabel = bill.discountReason ? ` (${bill.discountReason})` : '';
    const discountStr = `-Rs.${(discountAmount / 100).toFixed(2)}`;
    lines.push(padRight(`Discount${reasonLabel}:`, width - amountColWidth) + padLeft(discountStr, amountColWidth));
  }

  const cgst = bill.cgstAmount || 0;
  const sgst = bill.sgstAmount || 0;

  lines.push(padRight('CGST:', width - amountColWidth) + padLeft(`Rs.${(cgst / 100).toFixed(2)}`, amountColWidth));
  lines.push(padRight('SGST:', width - amountColWidth) + padLeft(`Rs.${(sgst / 100).toFixed(2)}`, amountColWidth));

  const grandTotalPaise = typeof bill.grandTotal === 'number'
    ? bill.grandTotal
    : Math.max(0, subtotalPaise - discountAmount + cgst + sgst);

  lines.push(divider);
  lines.push(padRight('GRAND TOTAL:', width - amountColWidth) + padLeft(`Rs.${(grandTotalPaise / 100).toFixed(2)}`, amountColWidth));
  lines.push(divider);

  // Payments History
  if (bill.payments?.length > 0) {
    lines.push('PAID VIA:');
    for (const p of bill.payments) {
      const refStr = p.reference ? ` (${p.reference})` : '';
      const methodStr = `${p.method}${refStr}`;
      const amountStr = `Rs.${(p.amount / 100).toFixed(2)}`;
      lines.push(padRight(methodStr, width - amountColWidth) + padLeft(amountStr, amountColWidth));
    }
    lines.push(`Status: ${bill.paymentStatus || 'PAID'}`);
    lines.push(divider);
  }

  // Footer Note
  const footerNote = profile.receiptFooterNote || 'Thank you for visiting Café Woody\'s!';
  lines.push(centerText(footerNote, width));
  lines.push(centerText('Please Come Again', width));
  lines.push(doubleDivider);
  lines.push('');
  lines.push('');
  lines.push('');
  lines.push('');
  lines.push('');

  return sanitizeThermalText(lines.join('\n'));
}

// Phase 20 Step 5: Shared Kitchen Slip Formatter (No prices, no GST, no payment info, no icons)
export function formatKitchenSlipText(orderOrBill = {}, options = {}) {
  const profile = options.businessProfile || orderOrBill.businessProfile || {};
  const printerConfig = options.printerConfig || {};
  const width = options.width || getCharsPerLine(printerConfig, { businessProfile: profile });
  const divider = '-'.repeat(width);
  const doubleDivider = '='.repeat(width);

  const lines = [];

  const dailyNum = orderOrBill.dailyOrderNumber || orderOrBill.invoiceNumber || 'N/A';
  lines.push(doubleDivider);
  lines.push(centerText('*** KITCHEN PREP SLIP ***', width));
  lines.push(centerText(`Order #${dailyNum}`, width));
  lines.push(divider);

  const tableObj = orderOrBill.table || options.table;
  const tableName = tableObj?.name || orderOrBill.tableName || options.tableName;
  const zoneName = tableObj?.zone?.name || options.zoneName || options.table?.zone?.name;
  const isParcel = orderOrBill.orderType === 'PARCEL' || (!tableName && !tableObj && !options.tableName);

  if (isParcel) {
    lines.push(centerText('>>> TAKEAWAY / PARCEL <<<', width));
    if (orderOrBill.customer?.name) {
      lines.push(centerText(`Cust: ${orderOrBill.customer.name}`, width));
    }
  } else {
    lines.push(centerText(`>>> DINE-IN: ${tableName ? tableName.toUpperCase() : 'TABLE'} <<<`, width));
    if (zoneName) {
      lines.push(centerText(`Zone: ${zoneName.toUpperCase()}`, width));
    }
  }
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
  lines.push('');
  lines.push('');
  lines.push('');
  lines.push('');
  lines.push('');

  return sanitizeThermalText(lines.join('\n'));
}
