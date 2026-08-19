// Cafe Woody's — Isolated & Resilient Print Service
// The SINGLE entry point for all printing feature code across the application

import { Capacitor } from '@capacitor/core';
import { formatReceipt } from './receiptFormatter';
import { printNative } from './nativePrinter';
import { webFallback } from './webFallback';

export async function detectConnector() {
  try {
    const res = await fetch('http://localhost:9200/health', {
      signal: AbortSignal.timeout(1000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function printReceipt(bill, printerIpAddress) {
  if (!bill) {
    return { success: false, error: 'No bill provided for printing' };
  }

  const formattedText = formatReceipt(bill);

  // 1. Native Capacitor Thermal Printing (Android Counter App)
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await printNative(formattedText, printerIpAddress);
      return result;
    } catch (err) {
      console.error('PrintService native exception isolated:', err);
      return { success: false, error: err.message || 'Native printing failed' };
    }
  }

  // 2. PC Print Connector Companion App (Windows/Mac Counter Browser)
  const hasConnector = await detectConnector();
  if (hasConnector) {
    try {
      const response = await fetch('http://localhost:9200/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: formattedText, bill })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, method: 'PC_CONNECTOR' };
      }
      console.warn('PC Print Connector returned error:', data.error);
    } catch (err) {
      console.warn('Failed to communicate with PC Print Connector:', err.message);
    }
  }

  // 3. Web Fallback (Browser / Waiter Phone / Kitchen Display)
  return webFallback(formattedText);
}

export async function reprintReceipt(bill, printerIpAddress) {
  return printReceipt(bill, printerIpAddress);
}
