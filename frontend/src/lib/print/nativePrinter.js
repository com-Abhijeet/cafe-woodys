// Cafe Woody's — Native ESC/POS Capacitor Thermal Printer Interface
import { Capacitor } from '@capacitor/core';
import { triggerRawBTIntent } from '../rawbtPrinter';

export async function printNative(formattedText, printerConfig = {}) {
  const connectionType = (printerConfig.connectionType || 'TCP').toLowerCase();
  const ip = printerConfig.ipAddress || '192.168.1.100';

  // If RAWBT or SYSTEM_DEFAULT connection type requested, trigger RawBT intent immediately
  if (connectionType === 'rawbt' || connectionType === 'system_default') {
    return triggerRawBTIntent(formattedText);
  }

  try {
    let ThermalPrinter = window?.ThermalPrinter || window?.Capacitor?.Plugins?.ThermalPrinter;

    if (!ThermalPrinter && Capacitor.isNativePlatform()) {
      try {
        const pkgName = 'thermal-printer-ionic';
        const plugin = await import(/* @vite-ignore */ pkgName);
        ThermalPrinter = plugin?.ThermalPrinter || window?.ThermalPrinter;
      } catch (e) {
        ThermalPrinter = window?.ThermalPrinter;
      }
    }

    if (!ThermalPrinter) {
      console.warn('ThermalPrinter ionic plugin not available, falling back to RawBT intent');
      return triggerRawBTIntent(formattedText);
    }

    // Convert [QR]: <uri> placeholder into native thermal printer ESC/POS <qr> tag
    const preparedText = formattedText.replace(/\[QR\]:\s*(upi:\/\/[^\s\n]+)/g, (_, uri) => `<qr size="6">${uri}</qr>`);

    let payload;
    if (connectionType === 'usb') {
      payload = { type: 'usb', text: preparedText };
    } else if (connectionType === 'bluetooth') {
      payload = { type: 'bluetooth', address: printerConfig.ipAddress || '', text: preparedText };
    } else {
      payload = {
        type: 'tcp',
        address: ip,
        port: 9100,
        id: printerConfig.id || 'counter-printer',
        text: preparedText
      };
    }

    // 6-Second Timeout Safeguard so unreachable printers never hang checkout screen
    const printPromise = new Promise((resolve, reject) => {
      ThermalPrinter.printFormattedText(
        payload,
        () => resolve({ success: true, method: connectionType.toUpperCase() }),
        (error) => reject(new Error(typeof error === 'string' ? error : 'Printer connection failed'))
      );
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Printer timed out (${connectionType === 'usb' ? 'USB' : connectionType === 'bluetooth' ? 'Bluetooth' : ip + ':9100'} unreachable)`)), 6000);
    });

    return await Promise.race([printPromise, timeoutPromise]);
  } catch (err) {
    console.warn(`Native direct ${connectionType} printing failed: ${err.message}. Falling back to RawBT companion app...`);
    return triggerRawBTIntent(formattedText);
  }
}

