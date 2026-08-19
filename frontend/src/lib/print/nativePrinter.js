// Cafe Woody's — Native ESC/POS Capacitor Thermal Printer Interface
import { Capacitor } from '@capacitor/core';

export async function printNative(formattedText, printerIpAddress) {
  const ip = printerIpAddress || '192.168.1.100'; // Default printer IP if unset

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

    // 6-Second Timeout Safeguard so unreachable printers never hang the checkout screen
    const printPromise = new Promise((resolve, reject) => {
      ThermalPrinter.printFormattedText(
        {
          type: 'tcp',
          address: ip,
          port: 9100,
          id: 'counter-printer',
          text: formattedText
        },
        () => resolve({ success: true }),
        (error) => reject(new Error(typeof error === 'string' ? error : 'Printer connection failed'))
      );
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Printer timed out (${ip}:9100 unreachable)`)), 6000);
    });

    return await Promise.race([printPromise, timeoutPromise]);
  } catch (err) {
    console.error('Native printing error caught:', err.message);
    return { success: false, error: err.message };
  }
}
