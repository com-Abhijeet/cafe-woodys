// Cafe Woody's — Native ESC/POS Capacitor Thermal Printer Interface

export async function printNative(formattedText, printerIpAddress) {
  const ip = printerIpAddress || '192.168.1.100'; // Default printer IP if unset

  try {
    // Dynamically import Capacitor plugin if installed inside Android shell
    const { ThermalPrinter } = await import('thermal-printer-ionic');

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
