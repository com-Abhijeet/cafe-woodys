// Cafe Woody's — Native ESC/POS Capacitor Thermal Printer Interface
import { Capacitor } from "@capacitor/core";
import { triggerRawBTIntent } from "../rawbtPrinter";

export async function requestBluetoothPermissionsNative() {
  if (!Capacitor.isNativePlatform()) return { granted: true };

  let ThermalPrinter =
    window?.ThermalPrinter ||
    window?.cordova?.plugins?.ThermalPrinter ||
    window?.plugins?.ThermalPrinter ||
    window?.Capacitor?.Plugins?.ThermalPrinter;

  if (!ThermalPrinter) {
    try {
      const pkgName = "thermal-printer-ionic";
      const plugin = await import(/* @vite-ignore */ pkgName);
      ThermalPrinter =
        plugin?.ThermalPrinter ||
        window?.ThermalPrinter ||
        window?.cordova?.plugins?.ThermalPrinter;
    } catch (e) {
      ThermalPrinter =
        window?.ThermalPrinter || window?.cordova?.plugins?.ThermalPrinter;
    }
  }

  if (
    ThermalPrinter &&
    (ThermalPrinter.requestBluetoothPermissions ||
      ThermalPrinter.requestPermissions)
  ) {
    return new Promise((resolve) => {
      const reqFn =
        ThermalPrinter.requestBluetoothPermissions ||
        ThermalPrinter.requestPermissions;
      reqFn.call(
        ThermalPrinter,
        { type: "bluetooth" },
        (res) => resolve(res || { granted: true }),
        (err) =>
          resolve({ granted: false, error: err?.error || "Permission denied" }),
      );
    });
  }

  return { granted: true };
}

export async function listAvailablePrintersNative() {
  const result = { bluetooth: [], usb: [] };

  if (Capacitor.isNativePlatform()) {
    await requestBluetoothPermissionsNative();
  }

  let ThermalPrinter =
    window?.ThermalPrinter ||
    window?.cordova?.plugins?.ThermalPrinter ||
    window?.plugins?.ThermalPrinter ||
    window?.Capacitor?.Plugins?.ThermalPrinter;

  if (!ThermalPrinter && Capacitor.isNativePlatform()) {
    try {
      const pkgName = "thermal-printer-ionic";
      const plugin = await import(/* @vite-ignore */ pkgName);
      ThermalPrinter =
        plugin?.ThermalPrinter ||
        window?.ThermalPrinter ||
        window?.cordova?.plugins?.ThermalPrinter;
    } catch (e) {
      ThermalPrinter =
        window?.ThermalPrinter || window?.cordova?.plugins?.ThermalPrinter;
    }
  }

  if (ThermalPrinter && ThermalPrinter.listPrinters) {
    const listBt = new Promise((resolve) => {
      ThermalPrinter.listPrinters(
        { type: "bluetooth" },
        (devices) => resolve(Array.isArray(devices) ? devices : []),
        (err) => {
          console.warn("Bluetooth discovery error:", err);
          resolve([]);
        },
      );
    });

    const listUsb = new Promise((resolve) => {
      ThermalPrinter.listPrinters(
        { type: "usb" },
        (devices) => resolve(Array.isArray(devices) ? devices : []),
        (err) => {
          console.warn("USB discovery error:", err);
          resolve([]);
        },
      );
    });

    const [btDevices, usbDevices] = await Promise.all([listBt, listUsb]);
    result.bluetooth = btDevices;
    result.usb = usbDevices;
  }

  return result;
}

// Global sequential queue chain to prevent WiFi print job collisions
let printQueueChain = Promise.resolve();

export async function printNative(formattedText, printerConfig = {}) {
  // Enforce sequential print execution
  return new Promise((resolve, reject) => {
    printQueueChain = printQueueChain
      .then(() => executePrintNativeWithRetry(formattedText, printerConfig))
      .then(resolve)
      .catch(reject);
  });
}

async function executePrintNativeWithRetry(formattedText, printerConfig = {}, attempt = 1) {
  const connectionType = (printerConfig.connectionType || "TCP").toLowerCase();
  const ip = printerConfig.ipAddress || "192.168.1.100";

  // If RAWBT or SYSTEM_DEFAULT connection type requested, trigger RawBT intent immediately
  if (connectionType === "rawbt" || connectionType === "system_default") {
    return triggerRawBTIntent(formattedText);
  }

  try {
    let ThermalPrinter =
      window?.ThermalPrinter ||
      window?.cordova?.plugins?.ThermalPrinter ||
      window?.plugins?.ThermalPrinter ||
      window?.Capacitor?.Plugins?.ThermalPrinter;

    if (!ThermalPrinter && Capacitor.isNativePlatform()) {
      try {
        const pkgName = "thermal-printer-ionic";
        const plugin = await import(/* @vite-ignore */ pkgName);
        ThermalPrinter =
          plugin?.ThermalPrinter ||
          window?.ThermalPrinter ||
          window?.cordova?.plugins?.ThermalPrinter;
      } catch (e) {
        ThermalPrinter =
          window?.ThermalPrinter || window?.cordova?.plugins?.ThermalPrinter;
      }
    }

    if (!ThermalPrinter) {
      console.warn(
        "ThermalPrinter ionic plugin not found on window object, falling back to RawBT intent",
      );
      return triggerRawBTIntent(formattedText);
    }

    // Strip any formatting tags and convert [QR] placeholder into native ESC/POS <qr> tag
    const cleanText = formattedText
      .replace(/\[b\]/g, "")
      .replace(/\[\/b\]/g, "")
      .replace(/<b>/g, "")
      .replace(/<\/b>/g, "");

    // Prepend ESC/POS Emphasized Bold command (\x1B\x45\x01) for deep dark thermal printing
    const preparedText =
      "\x1B\x45\x01" +
      cleanText.replace(
        /\[QR\]:\s*(upi:\/\/[^\r\n]+)/g,
        (_, uri) => `<qr size="6">${uri.trim()}</qr>`,
      );

    const paperWidth = Number(printerConfig.paperWidthMm) || 80;
    const charsPerLine = Number(printerConfig.charsPerLineOverride) || (paperWidth <= 58 ? 32 : 48);

    let payload;
    if (connectionType === "usb") {
      const usbTarget =
        printerConfig.ipAddress || printerConfig.name || "first";
      payload = {
        type: "usb",
        id: usbTarget,
        printerWidthMM: paperWidth,
        printerNbrCharactersPerLine: charsPerLine,
        mmFeedPaper: 25,
        dotsFeedPaper: 100,
        text: preparedText,
      };
    } else if (connectionType === "bluetooth") {
      if (Capacitor.isNativePlatform()) {
        await requestBluetoothPermissionsNative();
      }
      const btTarget = printerConfig.ipAddress || printerConfig.name || "first";
      payload = {
        type: "bluetooth",
        id: btTarget,
        address: btTarget,
        deviceName: btTarget,
        name: btTarget,
        printerWidthMM: paperWidth,
        printerNbrCharactersPerLine: charsPerLine,
        mmFeedPaper: 25,
        dotsFeedPaper: 100,
        text: preparedText,
      };
    } else {
      const targetId = `tcp-${ip}:${printerConfig.port || 9100}`;
      payload = {
        type: "tcp",
        id: targetId,
        address: ip,
        port: printerConfig.port || 9100,
        printerWidthMM: paperWidth,
        printerNbrCharactersPerLine: charsPerLine,
        mmFeedPaper: 25,
        dotsFeedPaper: 100,
        text: preparedText,
      };
    }

    // 6-Second Timeout Safeguard so unreachable printers never hang checkout screen
    const printPromise = new Promise((resolve, reject) => {
      const printMethod =
        ThermalPrinter.printFormattedTextAndCut ||
        ThermalPrinter.printFormattedText;
      printMethod.call(
        ThermalPrinter,
        payload,
        () => resolve({ success: true, method: connectionType.toUpperCase() }),
        (error) =>
          reject(
            new Error(
              typeof error === "string"
                ? error
                : error?.error || "Printer connection failed",
            ),
          ),
      );
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () =>
          reject(
            new Error(
              `Printer timed out (${
                connectionType === "usb"
                  ? "USB"
                  : connectionType === "bluetooth"
                  ? "Bluetooth"
                  : ip + ":9100"
              } unreachable)`,
            ),
          ),
        6000,
      );
    });

    return await Promise.race([printPromise, timeoutPromise]);
  } catch (err) {
    const isNetworkOrPipeErr =
      /broken pipe|epipe|econnreset|closed|socket|timeout|unreachable/i.test(err.message || "");

    if (isNetworkOrPipeErr && attempt < 3) {
      console.warn(`WiFi Print Attempt ${attempt} failed (${err.message}). Retrying in 350ms...`);
      await new Promise((res) => setTimeout(res, 350));
      return executePrintNativeWithRetry(formattedText, printerConfig, attempt + 1);
    }

    console.warn(
      `Native direct ${connectionType} printing failed after ${attempt} attempts: ${err.message}`,
    );
    if (Capacitor.isNativePlatform()) {
      alert(
        `Native ${connectionType.toUpperCase()} Printer Error: ${
          err.message || "Connection failed"
        }`,
      );
    }
    return triggerRawBTIntent(formattedText);
  }
}
