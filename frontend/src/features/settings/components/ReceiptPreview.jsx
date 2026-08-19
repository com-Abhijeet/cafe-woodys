import { formatReceipt, getCharsPerLine } from '../../../lib/print/receiptFormatter';
import { Printer } from 'lucide-react';
import styles from './ReceiptPreview.module.css';

const SAMPLE_BILL = {
  id: 'bill-sample-999',
  invoiceNumber: 142,
  financialYear: '2025-26',
  createdAt: new Date().toISOString(),
  table: { name: 'T-04', zone: { name: 'Main Café Floor' } },
  customer: { name: 'Rahul Sharma', phone: '+91 98765 43210' },
  foodTotal: 45000, // ₹450.00
  gamingTotal: 20000, // ₹200.00
  discountAmount: 5000, // ₹50.00
  cgstAmount: 1500, // ₹15.00
  sgstAmount: 1500, // ₹15.00
  grandTotal: 63000, // ₹630.00
  totalPaid: 63000,
  remainingBalance: 0,
  orders: [
    {
      items: [
        { menuItem: { name: 'Cold Coffee Shake' }, quantity: 2, priceSnapshot: 15000 },
        { menuItem: { name: 'Woody\'s Cheese Burger' }, quantity: 1, priceSnapshot: 15000 }
      ]
    }
  ],
  gamingSessions: [
    { playerLabel: 'PS5 Player 1', hourlyRateSnapshot: 20000 }
  ]
};

export function ReceiptPreview({ profile }) {
  const formattedText = formatReceipt(SAMPLE_BILL, profile || {});
  const charsPerLine = getCharsPerLine(profile || {});
  const rollWidthMm = profile?.thermalPaperWidthMm || 80;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Printer size={20} color="var(--color-brand)" />
          <h3 className={styles.title}>Live Thermal Receipt Print Preview</h3>
        </div>
        <span style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg-secondary)', fontWeight: 700 }}>
          Roll Width: {rollWidthMm}mm ({charsPerLine} chars/line)
        </span>
      </div>

      <div className={styles.previewBox} style={{ width: `${Math.min(100, Math.max(45, charsPerLine * 1.5))}%` }}>
        {formattedText}
      </div>
    </div>
  );
}
