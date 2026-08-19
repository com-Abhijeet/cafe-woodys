import { formatReceiptText } from './receiptFormatter';
import { fetchBusinessProfileApi } from '../features/settings/api/businessProfile.api';
import { detectConnector } from './print/PrintService';

export async function printBillViaRawBT(bill, options = {}) {
  let profile = options.businessProfile;

  if (!profile) {
    try {
      profile = await fetchBusinessProfileApi();
    } catch (err) {
      console.warn('Could not fetch business profile for receipt print:', err);
    }
  }

  const formattedText = formatReceiptText(bill, { ...options, businessProfile: profile });

  // 1. Check if PC Print Connector companion app is running locally on port 9200
  const hasConnector = await detectConnector();
  if (hasConnector) {
    try {
      const response = await fetch('http://localhost:9200/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: formattedText, bill })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return;
      }
    } catch (err) {
      console.warn('PC Connector call failed, falling back:', err.message);
    }
  }

  // 2. Construct RawBT URL scheme for mobile / Android tablets
  const rawbtUrl = `rawbt:data:text/plain;charset=utf-8,${encodeURIComponent(formattedText)}`;

  try {
    window.location.href = rawbtUrl;
  } catch (err) {
    console.error('Failed to trigger RawBT URL:', err);
    fallbackPrintPreview(formattedText);
  }
}

export function fallbackPrintPreview(text) {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt Print Preview</title>
          <style>
            body { font-family: monospace; font-size: 13px; white-space: pre; padding: 20px; }
          </style>
        </head>
        <body>
${text}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } else {
    alert(text);
  }
}
