// Cafe Woody's — Web Fallback Printer Handling

export function webFallback(formattedText) {
  try {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt Print Preview - Cafe Woody's</title>
            <style>
              body { font-family: monospace; font-size: 12px; white-space: pre; padding: 20px; background: #fff; color: #000; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>${formattedText}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
    return { success: true, isWebFallback: true };
  } catch (err) {
    console.warn('Web print window blocked or failed:', err.message);
    return { success: false, isWebFallback: true, message: 'Web popup print preview blocked by browser settings.' };
  }
}
