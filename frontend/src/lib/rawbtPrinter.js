import { formatReceiptText } from './receiptFormatter';

export function printBillViaRawBT(bill, options = {}) {
  const formattedText = formatReceiptText(bill, options);

  // Construct RawBT URL scheme
  // Format: rawbt:data:text/plain;charset=utf-8,ENCODED_TEXT
  const rawbtUrl = `rawbt:data:text/plain;charset=utf-8,${encodeURIComponent(formattedText)}`;

  try {
    // Attempt triggering RawBT app via window.location
    window.location.href = rawbtUrl;
  } catch (err) {
    console.error('Failed to trigger RawBT URL:', err);
    // Desktop fallback / print preview
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
