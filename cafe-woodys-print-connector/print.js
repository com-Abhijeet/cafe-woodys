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
              white-space: pre;
              margin: 0;
              padding: 10px;
              width: 100%;
              color: #000;
              background: #fff;
            }
          </style>
        </head>
        <body>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
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
