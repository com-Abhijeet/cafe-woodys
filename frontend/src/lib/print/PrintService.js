// Cafe Woody's — Isolated & Resilient Print Service
// The SINGLE entry point for all printing feature code across the application

import { Capacitor } from '@capacitor/core';
import { formatReceiptText, formatKitchenSlipText } from '../receiptFormatter';
import { printNative } from './nativePrinter';
import { printBillViaRawBT } from '../rawbtPrinter';
import { webFallback } from './webFallback';
import { apiClient } from '../apiClient';
import { logPrintEvent } from './printLogger';

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
  const connectionType = (printerConfig.connectionType || '').toUpperCase();
  const targetPrinterName = printerConfig.name || `Billing Printer (${connectionType || 'DEFAULT'})`;

  let res;
  try {
    if (connectionType === 'RAWBT') {
      res = await printBillViaRawBT(formattedText, { businessProfile: printerConfig.businessProfile });
    } else if (Capacitor.isNativePlatform()) {
      try {
        res = await printNative(formattedText, printerConfig);
      } catch (err) {
        console.error('PrintService native exception isolated:', err);
        res = await printBillViaRawBT(formattedText, { businessProfile: printerConfig.businessProfile });
      }
    } else {
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
            res = { success: true, method: 'PC_CONNECTOR' };
          } else {
            res = { success: false, error: data.error || 'PC Print Connector failed' };
          }
        } catch (err) {
          res = { success: false, error: err.message };
        }
      } else {
        res = await webFallback(formattedText);
      }
    }
  } catch (err) {
    res = { success: false, error: err.message };
  }

  logPrintEvent({
    purpose: 'RECEIPT',
    status: res.success ? 'SENT' : (res.isWebFallback ? 'WEB_FALLBACK' : 'ERROR'),
    method: res.method || connectionType || 'WEB',
    formattedText,
    targetPrinter: targetPrinterName,
    error: res.error,
    orderId: bill.id
  });

  return res;
}

// Phase 20 Step 5 & Phase 21 Step 3: Kitchen Slip Printing (Price-free prep/packing slip with Fallback Routing)
export async function printKitchenSlip(orderOrBill, customPrinterConfig = null, options = {}) {
  if (!orderOrBill) {
    return { success: false, error: 'No order provided for kitchen slip printing' };
  }

  const printerConfig = customPrinterConfig || (await resolvePrinterConfig('KITCHEN'));
  const formattedText = formatKitchenSlipText(orderOrBill, options);
  const connectionType = (printerConfig.connectionType || '').toUpperCase();
  const targetPrinterName = printerConfig.name || `Kitchen Printer (${connectionType || 'DEFAULT'})`;

  let res;
  try {
    if (connectionType === 'RAWBT') {
      res = await printBillViaRawBT(formattedText, { businessProfile: printerConfig.businessProfile });
    } else if (Capacitor.isNativePlatform()) {
      try {
        res = await printNative(formattedText, printerConfig);
      } catch (err) {
        console.warn('Native kitchen printing failed, falling back to RawBT:', err.message);
        res = await printBillViaRawBT(formattedText, { businessProfile: printerConfig.businessProfile });
      }
    } else {
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
            res = { success: true, method: 'PC_CONNECTOR' };
          } else {
            res = { success: false, error: data.error || 'PC Print Connector failed' };
          }
        } catch (err) {
          res = { success: false, error: err.message };
        }
      } else {
        res = await webFallback(formattedText);
      }
    }
  } catch (err) {
    res = { success: false, error: err.message };
  }

  logPrintEvent({
    purpose: 'KOT',
    status: res.success ? 'SENT' : (res.isWebFallback ? 'WEB_FALLBACK' : 'ERROR'),
    method: res.method || connectionType || 'WEB',
    formattedText,
    targetPrinter: targetPrinterName,
    error: res.error,
    orderId: orderOrBill.id
  });

  return res;
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
