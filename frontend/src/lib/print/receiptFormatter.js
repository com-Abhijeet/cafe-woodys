// Cafe Woody's — Receipt Formatter for Thermal Printing (Dynamic Roll Width & UPI QR)

const CHAR_WIDTH = {
  MM_58: 32,
  MM_80: 48
};

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

  const paperWidthKey = profile.thermalPaperWidth || 'MM_80';
  const width = CHAR_WIDTH[paperWidthKey] || CHAR_WIDTH.MM_80;

  const dateStr = new Date(bill.createdAt || Date.now()).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const invoiceNo = typeof bill.invoiceNumber === 'number'
    ? `Invoice #${bill.invoiceNumber} (${bill.financialYear || ''})`
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
  lines.push(`Table: ${bill.table?.name || 'Table'} (${bill.table?.zone?.name || 'Zone'})`);
  if (bill.customer) {
    lines.push(`Customer: ${bill.customer.name} (${bill.customer.phone})`);
  }
  lines.push(dividerSingle);

  // Column Header Allocation based on Roll Width
  if (width === 32) {
    // 58mm: ITEM(16) QTY(3) PRICE(11)
    lines.push('ITEM             QTY      PRICE');
  } else {
    // 80mm: ITEM(28) QTY(5) PRICE(13)
    lines.push('ITEM                         QTY         PRICE');
  }
  lines.push(dividerSingle);

  // 1. Food Orders Line Items
  if (bill.orders?.length > 0) {
    bill.orders.forEach((ord) => {
      ord.items?.forEach((i) => {
        const itemPrice = ((i.priceSnapshot * i.quantity) / 100).toFixed(2);
        if (width === 32) {
          const name = (i.menuItem?.name || 'Item').padEnd(16).slice(0, 16);
          const qty = String(i.quantity).padStart(3);
          const amt = `₹${itemPrice}`.padStart(11);
          lines.push(`${name} ${qty} ${amt}`);
        } else {
          const name = (i.menuItem?.name || 'Item').padEnd(28).slice(0, 28);
          const qty = String(i.quantity).padStart(5);
          const amt = `₹${itemPrice}`.padStart(13);
          lines.push(`${name} ${qty} ${amt}`);
        }
      });
    });
  }

  // 2. Gaming Sessions Line Items
  if (bill.gamingSessions?.length > 0) {
    bill.gamingSessions.forEach((s) => {
      const chargeStr = `₹${((s.hourlyRateSnapshot || 0) / 100).toFixed(2)}`;
      if (width === 32) {
        const name = `Play: ${s.playerLabel || 'Player'}`.padEnd(16).slice(0, 16);
        const amt = chargeStr.padStart(15);
        lines.push(`${name} ${amt}`);
      } else {
        const name = `Gaming: ${s.playerLabel || 'Player'}`.padEnd(28).slice(0, 28);
        const amt = chargeStr.padStart(19);
        lines.push(`${name} ${amt}`);
      }
    });
  }

  lines.push(dividerSingle);

  // Totals Breakdown
  const fmtRow = (label, amountVal) => {
    const valStr = `₹${(amountVal / 100).toFixed(2)}`;
    const labelLen = width - valStr.length;
    return label.padEnd(labelLen) + valStr;
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

  // Embedded UPI Payment Deep Link (for ESC/POS QR printing)
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
  lines.push('\n\n\n'); // Feed spacing for paper tear

  return lines.join('\n');
}
