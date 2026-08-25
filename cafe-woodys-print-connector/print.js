const { BrowserWindow } = require('electron');
const { getDefaultPrinter } = require('./printerSettings');

async function printReceiptText(text) {
  const selectedPrinter = getDefaultPrinter();

  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt Print</title>
          <style>
            @page { margin: 0; }
            body {
              font-family: monospace;
              font-size: 12px;
              line-height: 1.2;
              white-space: pre-wrap;
              margin: 0;
              padding: 10px;
              width: 100%;
              color: #000;
              background: #fff;
            }
          </style>
        </head>
        <body><pre style="font-family: monospace; font-size: 12px; margin:0;">${
          text
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\[QR\]:\s*(upi:\/\/[^\s\n]+)/g, (_, uri) => {
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(uri)}`;
              return `</pre><div style="text-align:center; margin: 12px 0;"><img src="${qrUrl}" width="180" height="180" style="display:inline-block; margin:0 auto;" /></div><pre style="font-family: monospace; font-size: 12px; margin:0;">`;
            })
        }</pre></body>
      </html>
    `;

    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    win.webContents.on('did-finish-load', () => {
      const printOptions = {
        silent: true,
        printBackground: true
      };

      if (selectedPrinter) {
        printOptions.deviceName = selectedPrinter;
      }

      win.webContents.print(printOptions, (success, failureReason) => {
        win.close();
        if (success) {
          resolve({ success: true, printer: selectedPrinter || 'Default OS Printer' });
        } else {
          reject(new Error(failureReason || 'Electron silent print failed'));
        }
      });
    });
  });
}

module.exports = {
  printReceiptText
};
