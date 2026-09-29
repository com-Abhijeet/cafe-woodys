import QRCode from 'qrcode';
import { triggerRawBTIntent } from '../rawbtPrinter';

export async function webFallback(formattedText) {
  try {
    let htmlBody = formattedText
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const qrMatches = [...htmlBody.matchAll(/\[QR\]:\s*(upi:\/\/[^\r\n]+)/g)];
    for (const match of qrMatches) {
      const fullTag = match[0];
      const uri = match[1].trim();
      try {
        const dataUrl = await QRCode.toDataURL(uri, { width: 180, margin: 1 });
        const imgHtml = `</pre><div style="text-align:center; margin: 10px 0;"><img src="${dataUrl}" width="160" height="160" style="display:inline-block; margin:0 auto;" /></div><pre style="font-family: monospace; font-size: 11px; margin:0;">`;
        htmlBody = htmlBody.replace(fullTag, () => imgHtml);
      } catch (e) {
        console.warn('Failed to generate offline QR image:', e);
      }
    }

    const printWindow = window.open("", "_blank", "width=400,height=600");
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
      return { success: true, isWebFallback: true };
    } else {
      console.warn("Web popup print window blocked by browser. Triggering RawBT fallback...");
      return triggerRawBTIntent(formattedText);
    }
  } catch (err) {
    console.warn("Web print window blocked or failed:", err.message);
    return triggerRawBTIntent(formattedText);
  }
}

