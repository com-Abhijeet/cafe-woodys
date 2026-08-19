const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { getDefaultPrinter, setDefaultPrinter } = require('./printerSettings');
const { printReceiptText } = require('./print');

let tray = null;
let settingsWindow = null;
const server = express();
const PORT = 9200;

// Enable CORS so local web app (running on localhost or Vercel) can send print jobs to localhost:9200
server.use(cors());
server.use(express.json());

// Healthcheck Endpoint
server.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: "Café Woody's PC Thermal Print Connector",
    selectedPrinter: getDefaultPrinter() || 'System Default'
  });
});

// Print Receipt Endpoint
server.post('/print', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) {
      return res.status(400).json({ success: false, error: 'No text provided in print payload' });
    }

    const result = await printReceiptText(text);
    return res.json({ success: true, result });
  } catch (err) {
    console.error('Print connector error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// List Printers Endpoint
server.get('/printers', async (req, res) => {
  try {
    const printers = await settingsWindow?.webContents.getPrintersAsync() || [];
    return res.json({ printers, selectedPrinter: getDefaultPrinter() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 480,
    height: 420,
    title: "Café Woody's PC Print Connector Settings",
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>PC Thermal Print Connector</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; background: #f8f9fa; color: #2c3e50; }
          h2 { margin-top: 0; color: #6B3F2A; font-size: 20px; }
          .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          label { display: block; font-weight: 600; margin-bottom: 8px; font-size: 13px; color: #4a5568; }
          select { width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e0; font-size: 14px; background: #fff; }
          .status { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #27ae60; margin-top: 12px; }
          .dot { width: 8px; height: 8px; border-radius: 50%; background: #27ae60; }
          .footer { font-size: 11px; color: #a0aec0; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h2>☕ Café Woody's Print Connector</h2>
        <div class="card">
          <label for="printerSelect">Select Default Windows/Mac Thermal Printer:</label>
          <select id="printerSelect" onchange="onPrinterChange()">
            <option value="">Loading printers...</option>
          </select>
          <div class="status">
            <div class="dot"></div> Connector active on http://localhost:9200
          </div>
        </div>
        <div class="footer">Developed by Kosh Technologies</div>

        <script>
          const { ipcRenderer } = require('electron');

          async function loadPrinters() {
            const data = await ipcRenderer.invoke('get-printers');
            const select = document.getElementById('printerSelect');
            select.innerHTML = '<option value="">-- Use OS Default Printer --</option>';

            data.printers.forEach(p => {
              const opt = document.createElement('option');
              opt.value = p.name;
              opt.textContent = p.name + (p.isDefault ? ' (System Default)' : '');
              if (p.name === data.selectedPrinter) opt.selected = true;
              select.appendChild(opt);
            });
          }

          function onPrinterChange() {
            const select = document.getElementById('printerSelect');
            ipcRenderer.send('save-printer', select.value);
          }

          loadPrinters();
        </script>
      </body>
    </html>
  `;

  settingsWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

ipcMain.handle('get-printers', async () => {
  const printers = await settingsWindow?.webContents.getPrintersAsync() || [];
  return { printers, selectedPrinter: getDefaultPrinter() };
});

ipcMain.on('save-printer', (event, printerName) => {
  setDefaultPrinter(printerName);
});

app.whenReady().then(() => {
  // Start local HTTP server
  server.listen(PORT, () => {
    console.log(`☕ PC Thermal Print Connector server listening on http://localhost:${PORT}`);
  });

  createSettingsWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createSettingsWindow();
  });
});

app.on('window-all-closed', (e) => {
  // Keep app active in background/tray
  e.preventDefault();
});
