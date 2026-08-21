// Cafe Woody's — Native ESC/POS Capacitor Thermal Printer Interface
import { Capacitor } from '@capacitor/core';

export async function printNative(formattedText, printerConfig = {}) {
  const connectionType = (printerConfig.connectionType || 'TCP').toLowerCase();
  const ip = printerConfig.ipAddress || '192.168.1.100';

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
      return { success: false, error: 'Thermal printer ionic plugin not available on this platform' };
    }

    // Step 8: Support Native Android USB printing directly via thermal-printer-ionic plugin (no RawBT needed!)
    const payload = connectionType === 'usb'
      ? {
          type: 'usb',
          text: formattedText
        }
      : {
          type: 'tcp',
          address: ip,
          port: 9100,
          id: printerConfig.id || 'counter-printer',
          text: formattedText
        };

    // 6-Second Timeout Safeguard so unreachable printers never hang checkout screen
    const printPromise = new Promise((resolve, reject) => {
      ThermalPrinter.printFormattedText(
        payload,
        () => resolve({ success: true }),
        (error) => reject(new Error(typeof error === 'string' ? error : 'Printer connection failed'))
      );
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Printer timed out (${connectionType === 'usb' ? 'USB' : ip + ':9100'} unreachable)`)), 6000);
    });

    return await Promise.race([printPromise, timeoutPromise]);
  } catch (err) {
    console.error('Native printing error caught:', err.message);
    return { success: false, error: err.message };
  }
}
