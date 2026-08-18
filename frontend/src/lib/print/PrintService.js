// Cafe Woody's — Isolated & Resilient Print Service
// The SINGLE entry point for all printing feature code across the application

import { Capacitor } from '@capacitor/core';
import { formatReceipt } from './receiptFormatter';
import { printNative } from './nativePrinter';
import { webFallback } from './webFallback';

export async function printReceipt(bill, printerIpAddress) {
  if (!bill) {
    return { success: false, error: 'No bill provided for printing' };
  }

  const formattedText = formatReceipt(bill);

  // 1. Web Fallback (Browser / Waiter Phone / Kitchen Display)
  if (!Capacitor.isNativePlatform()) {
    return webFallback(formattedText);
  }

  // 2. Native Capacitor Thermal Printing (Android Counter App)
  try {
    const result = await printNative(formattedText, printerIpAddress);
    return result;
  } catch (err) {
    // Print failure is reported as a result status, NEVER thrown as an uncaught exception
    console.error('PrintService exception isolated:', err);
    return { success: false, error: err.message || 'Printing failed' };
  }
}

export async function reprintReceipt(bill, printerIpAddress) {
  return printReceipt(bill, printerIpAddress);
}
