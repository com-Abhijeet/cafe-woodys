import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { buildUpiUri } from '../../../lib/print/receiptFormatter';
import { QrCode, AlertCircle } from 'lucide-react';

export function UpiQrCode({ upiId, upiPayeeName, amountPaise, note }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!upiId || !amountPaise || amountPaise <= 0) {
      setQrDataUrl('');
      return;
    }

    const upiUri = buildUpiUri({ upiId, payeeName: upiPayeeName, amountPaise, note });
    if (upiUri) {
      QRCode.toDataURL(upiUri, { width: 220, margin: 2 })
        .then((url) => {
          setQrDataUrl(url);
          setError('');
        })
        .catch((err) => {
          console.error('Failed to generate UPI QR:', err);
          setError('Failed to generate QR');
        });
    }
  }, [upiId, upiPayeeName, amountPaise, note]);

  if (!upiId) {
    return (
      <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
        <QrCode size={18} style={{ display: 'block', margin: '0 auto 4px auto' }} />
        UPI VPA not set. Configure UPI ID in Settings to show amount-embedded payment QR codes.
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <AlertCircle size={14} /> {error}
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-3)', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#000', marginBottom: '6px' }}>
        Scan with Google Pay / PhonePe / Paytm / BHIM
      </div>
      {qrDataUrl && (
        <img
          src={qrDataUrl}
          alt="UPI Payment QR Code"
          style={{ width: '180px', height: '180px', display: 'block', margin: '0 auto' }}
        />
      )}
      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-brand)', marginTop: '4px' }}>
        Exact Amount: ₹{(amountPaise / 100).toFixed(2)}
      </div>
      <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
        Payee: {upiPayeeName || 'Cafe Woodys'} ({upiId})
      </div>
    </div>
  );
}
