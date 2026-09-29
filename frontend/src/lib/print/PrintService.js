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
    let printers = [];
    try {
      const raw = localStorage.getItem('cafe_woodys_settings_cache');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.printerConfigs) && parsed.printerConfigs.length > 0) {
          printers = parsed.printerConfigs;
        }
      }
    } catch (e) {}

    if (printers.length === 0) {
      const res = await apiClient('/printer-configs');
      printers = Array.isArray(res) ? res : (res?.data || []);
    }

    // Prioritize enabled default printer for requested purpose
    let target =
      printers.find((p) => p.purpose === purpose && p.isEnabled && p.isDefault) ||
      printers.find((p) => p.purpose === purpose && p.isEnabled);

    if (!target && purpose === 'KITCHEN') {
      // Fallback routing: if dedicated kitchen printer isn't available, fall back to default billing printer
      target =
        printers.find((p) => p.purpose === 'BILLING' && p.isEnabled && p.isDefault) ||
        printers.find((p) => p.purpose === 'BILLING' && p.isEnabled);
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

  const hasValidConfig = customPrinterConfig && typeof customPrinterConfig === 'object' && Boolean(customPrinterConfig.connectionType);
  const printerConfig = hasValidConfig ? customPrinterConfig : (await resolvePrinterConfig('BILLING'));
  const formattedText = formatReceiptText(bill, { printerConfig });
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

  const hasValidConfig = customPrinterConfig && typeof customPrinterConfig === 'object' && Boolean(customPrinterConfig.connectionType);
  const printerConfig = hasValidConfig ? customPrinterConfig : (await resolvePrinterConfig('KITCHEN'));
  const formattedText = formatKitchenSlipText(orderOrBill, { ...options, printerConfig });
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
