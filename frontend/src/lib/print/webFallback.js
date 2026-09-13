// Cafe Woody's — Web Fallback Printer Handling

export function webFallback(formattedText) {
  try {
    const htmlBody = formattedText
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\[QR\]:\s*(upi:\/\/[^\s\n]+)/g, (_, uri) => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(uri)}`;
        return `</pre><div style="text-align:center; margin: 12px 0;"><img src="${qrUrl}" width="180" height="180" style="display:inline-block; margin:0 auto;" /></div><pre style="font-family: monospace; font-size: 12px; margin:0;">`;
      });

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt Print Preview - Cafe Woody's</title>
            <style>
              * { box-sizing: border-box; }
              @page { margin: 0mm; size: 72mm auto; }
              body {
                font-family: 'Courier New', Courier, monospace;
                font-size: 11px;
                font-weight: 900 !important;
                color: #000000 !important;
                white-space: pre-wrap;
                padding: 1mm 2mm;
                margin: 0;
                max-width: 72mm;
                background: #ffffff;
                -webkit-font-smoothing: none !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                letter-spacing: -0.1px;
              }
              pre {
                font-family: 'Courier New', Courier, monospace;
                font-size: 11px;
                font-weight: 900 !important;
                color: #000000 !important;
                margin: 0;
                line-height: 1.2;
              }
              @media print {
                @page { margin: 0mm; size: 72mm auto; }
                body { padding: 1mm; margin: 0; max-width: 72mm; color: #000000 !important; font-weight: 900 !important; }
                pre { color: #000000 !important; font-weight: 900 !important; }
              }
            </style>
          </head>
          <body><pre>${htmlBody}</pre></body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 400);
    }
    return { success: true, isWebFallback: true };
  } catch (err) {
    console.warn('Web print window blocked or failed:', err.message);
    return { success: false, isWebFallback: true, message: 'Web popup print preview blocked by browser settings.' };
  }
}
