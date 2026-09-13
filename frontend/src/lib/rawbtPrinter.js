import { formatReceiptText, sanitizeThermalText } from './receiptFormatter';
import { fetchBusinessProfileApi } from '../features/settings/api/businessProfile.api';
import { detectConnector } from './print/PrintService';

export function triggerRawBTIntent(text) {
  const sanitized = sanitizeThermalText(text).replace(/\[b\]/g, '').replace(/\[\/b\]/g, '');
  try {
    const base64Data = btoa(unescape(encodeURIComponent(sanitized)));
    const rawbtUrl = `rawbt:data:text/plain;base64,${base64Data}`;
    window.location.href = rawbtUrl;
    return { success: true, method: 'RAWBT' };
  } catch (err) {
    console.error('Failed to trigger RawBT URL:', err);
    return fallbackPrintPreview(sanitized);
  }
}

export async function printBillViaRawBT(billOrText, options = {}) {
  let formattedText = typeof billOrText === 'string' ? billOrText : '';

  if (!formattedText && billOrText) {
    let profile = options.businessProfile;
    if (!profile) {
      try {
        profile = await fetchBusinessProfileApi();
      } catch (err) {
        console.warn('Could not fetch business profile for receipt print:', err);
      }
    }
    formattedText = formatReceiptText(billOrText, { ...options, businessProfile: profile });
  }

  // 1. Check if PC Print Connector companion app is running locally on port 9200
  const hasConnector = await detectConnector();
  if (hasConnector) {
    try {
      const response = await fetch('http://localhost:9200/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: formattedText, bill: typeof billOrText === 'object' ? billOrText : null })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, method: 'PC_CONNECTOR' };
      }
    } catch (err) {
      console.warn('PC Connector call failed, falling back:', err.message);
    }
  }

  // 2. Construct RawBT Base64 Intent
  return triggerRawBTIntent(formattedText);
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
