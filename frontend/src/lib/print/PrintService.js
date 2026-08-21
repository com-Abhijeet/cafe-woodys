// Cafe Woody's — Isolated & Resilient Print Service
// The SINGLE entry point for all printing feature code across the application

import { Capacitor } from '@capacitor/core';
import { formatReceiptText, formatKitchenSlipText } from '../receiptFormatter';
import { printNative } from './nativePrinter';
import { webFallback } from './webFallback';
import { apiClient } from '../apiClient';

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

// Phase 21 Step 3: Resolves dedicated printer or falls back from KITCHEN -> BILLING printer
export async function resolvePrinterConfig(purpose = 'BILLING') {
  try {
    const res = await apiClient('/printer-configs');
    const printers = res.data || [];
    let target = printers.find((p) => p.purpose === purpose && p.isEnabled);
    if (!target && purpose === 'KITCHEN') {
      // Step 3 Fallback routing: if dedicated kitchen printer isn't available, fall back to billing printer
      target = printers.find((p) => p.purpose === 'BILLING' && p.isEnabled);
    }
    return target || {};
  } catch (err) {
    console.warn('Failed to resolve printer config:', err.message);
    return {};
  }
}

export async function printReceipt(bill, customPrinterConfig = null) {
  if (!bill) {
    return { success: false, error: 'No bill provided for printing' };
  }

  const printerConfig = customPrinterConfig || (await resolvePrinterConfig('BILLING'));
  const formattedText = formatReceiptText(bill);

  // 1. Native Capacitor Thermal Printing (Android Counter App - TCP or USB)
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await printNative(formattedText, printerConfig);
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

// Phase 20 Step 5 & Phase 21 Step 3: Kitchen Slip Printing (Price-free prep/packing slip with Fallback Routing)
export async function printKitchenSlip(orderOrBill, customPrinterConfig = null) {
  if (!orderOrBill) {
    return { success: false, error: 'No order provided for kitchen slip printing' };
  }

  // Phase 21 Step 3: Resolves KITCHEN printer first, falling back to BILLING printer
  const printerConfig = customPrinterConfig || (await resolvePrinterConfig('KITCHEN'));
  const formattedText = formatKitchenSlipText(orderOrBill);

  if (Capacitor.isNativePlatform()) {
    try {
      return await printNative(formattedText, printerConfig);
    } catch (err) {
      return { success: false, error: err.message || 'Native kitchen printing failed' };
    }
  }

  const hasConnector = await detectConnector();
  if (hasConnector) {
    try {
      const response = await fetch('http://localhost:9200/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: formattedText })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, method: 'PC_CONNECTOR' };
      }
    } catch (err) {
      console.warn('Failed to communicate with PC Print Connector:', err.message);
    }
  }

  return webFallback(formattedText);
}

// Phase 20 Step 3 & Phase 21 Step 3: Dual-Slip Printing for Parcel Bills
export async function printParcelDualSlips(bill, customPrinterConfig = null) {
  // 1. Customer Bill (Priced)
  const custResult = await printReceipt(bill, customPrinterConfig);

  // 2. Counter/Kitchen Prep Slip (Price-free, routed to KITCHEN or BILLING fallback)
  const prepResult = await printKitchenSlip(bill, customPrinterConfig);

  return {
    customerSlip: custResult,
    prepSlip: prepResult,
    success: custResult.success || prepResult.success
  };
}

export async function reprintReceipt(bill, printerConfig) {
  return printReceipt(bill, printerConfig);
}
