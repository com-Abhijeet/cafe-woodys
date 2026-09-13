// Cafe Woody's — Receipt Formatter for Thermal Printing (Free-Form Roll Width & Override)
import { formatInvoiceNumber } from '../invoiceFormat';

export function getCharsPerLine(profile = {}) {
  if (profile.thermalCharsPerLineOverride && Number(profile.thermalCharsPerLineOverride) > 0) {
    return Number(profile.thermalCharsPerLineOverride);
  }
  const widthMm = Number(profile.thermalPaperWidthMm) || (profile.thermalPaperWidth === 'MM_58' ? 58 : 80);
  return Math.max(16, Math.floor(widthMm * 0.6));
}

function centerText(str, width) {
  if (!str) return '';
  if (str.length >= width) return str.slice(0, width);
  const leftPadding = Math.floor((width - str.length) / 2);
  return ' '.repeat(leftPadding) + str;
}

export function buildUpiUri({ upiId, payeeName, amountPaise, note }) {
  if (!upiId) return null;
  const amountStr = (amountPaise / 100).toFixed(2);
  const encodedName = encodeURIComponent(payeeName || 'Cafe Woodys');
  const encodedNote = encodeURIComponent(note || 'Cafe Woodys Bill');
  return `upi://pay?pa=${upiId}&pn=${encodedName}&am=${amountStr}&cu=INR&tn=${encodedNote}`;
}

export function formatReceipt(bill, profile = {}) {
  if (!bill) return '';

  const width = getCharsPerLine(profile);

  const dateStr = new Date(bill.createdAt || Date.now()).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const invoiceNo = typeof bill.invoiceNumber === 'number'
    ? formatInvoiceNumber(bill.invoiceNumber, bill.financialYear)
    : (bill.invoiceNumber || `Bill #${bill.id.slice(-6).toUpperCase()}`);

  const lines = [];
  const dividerDouble = '='.repeat(width);
  const dividerSingle = '-'.repeat(width);

  lines.push(dividerDouble);
  lines.push(centerText(profile.businessName || 'CAFE WOODY\'S', width));
  if (profile.address) {
    lines.push(centerText(profile.address, width));
  }
  if (profile.gstin) {
    lines.push(centerText(`GSTIN: ${profile.gstin}`, width));
  }
  lines.push(dividerDouble);
  lines.push(`Date: ${dateStr}`);
  lines.push(`${invoiceNo}`);
  lines.push(`Table: ${bill.table?.name || (bill.orderType === 'PARCEL' ? 'Parcel / Takeaway' : 'Table')} (${bill.table?.zone?.name || 'Zone'})`);
  if (bill.customer) {
    lines.push(`Customer: ${bill.customer.name} (${bill.customer.phone})`);
  }
  lines.push(dividerSingle);

  // Dynamic Column Header Allocation based on chars per line
  const qtyColWidth = 4;
  const priceColWidth = 10;
  const nameColWidth = Math.max(10, width - qtyColWidth - priceColWidth - 2);

  const headerName = 'ITEM'.padEnd(nameColWidth).slice(0, nameColWidth);
  const headerQty = 'QTY'.padStart(qtyColWidth);
  const headerPrice = 'PRICE'.padStart(priceColWidth);
  lines.push(`${headerName} ${headerQty} ${headerPrice}`);
  lines.push(dividerSingle);

  // 1. Food Orders Line Items
  if (bill.orders?.length > 0) {
    bill.orders.forEach((ord) => {
      ord.items?.forEach((i) => {
        const itemPrice = ((i.priceSnapshot * i.quantity) / 100).toFixed(2);
        const name = (i.menuItem?.name || 'Item').padEnd(nameColWidth).slice(0, nameColWidth);
        const qty = String(i.quantity).padStart(qtyColWidth);
        const amt = `₹${itemPrice}`.padStart(priceColWidth);
        lines.push(`${name} ${qty} ${amt}`);
      });
    });
  }

  // 2. Gaming Sessions Line Items
  if (bill.gamingSessions?.length > 0) {
    bill.gamingSessions.forEach((s) => {
      const chargeStr = `₹${((s.hourlyRateSnapshot || 0) / 100).toFixed(2)}`;
      const name = `Play: ${s.playerLabel || 'Player'}`.padEnd(nameColWidth).slice(0, nameColWidth);
      const amt = chargeStr.padStart(priceColWidth + qtyColWidth + 1);
      lines.push(`${name} ${amt}`);
    });
  }

  lines.push(dividerSingle);

  // Totals Breakdown
  const fmtRow = (label, amountVal) => {
    const valStr = `₹${(amountVal / 100).toFixed(2)}`;
    const labelLen = Math.max(1, width - valStr.length);
    return label.padEnd(labelLen).slice(0, labelLen) + valStr;
  };

  lines.push(fmtRow('Food Subtotal:', bill.foodTotal || 0));
  if (bill.gamingTotal > 0) {
    lines.push(fmtRow('Gaming Subtotal:', bill.gamingTotal || 0));
  }
  if (bill.discountAmount > 0) {
    lines.push(fmtRow('Discount:', -(bill.discountAmount || 0)));
  }
  lines.push(fmtRow('CGST:', bill.cgstAmount || 0));
  lines.push(fmtRow('SGST:', bill.sgstAmount || 0));
  lines.push(dividerDouble);
  lines.push(fmtRow('GRAND TOTAL:', bill.grandTotal || 0));
  lines.push(fmtRow('Paid:', bill.totalPaid || 0));
  lines.push(fmtRow('Balance Due:', bill.remainingBalance || 0));
  lines.push(dividerDouble);

  // Embedded UPI Payment Deep Link
  if (profile.upiId && (bill.remainingBalance || bill.grandTotal) > 0) {
    const amountToPay = bill.remainingBalance > 0 ? bill.remainingBalance : bill.grandTotal;
    const upiUri = buildUpiUri({
      upiId: profile.upiId,
      payeeName: profile.upiPayeeName || profile.businessName,
      amountPaise: amountToPay,
      note: invoiceNo
    });
    lines.push(centerText('--- SCAN TO PAY VIA UPI ---', width));
    lines.push(`[QR]: ${upiUri}`);
    lines.push(dividerSingle);
  }

  lines.push(centerText(profile.receiptFooterNote || 'Thank you for visiting Woody\'s!', width));
  lines.push(centerText('Please Come Again!', width));
  lines.push('\n\n\n\n\n\n');

  return lines.join('\n');
}
