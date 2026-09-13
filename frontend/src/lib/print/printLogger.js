// Cafe Woody's — Live Print & System Logger
// Persists print logs in localStorage & notifies UI subscribers for real-time inspection

const LOG_STORAGE_KEY = 'woodys_print_logs_v1';
const MAX_LOGS = 100;

const listeners = new Set();

export function getPrintLogs() {
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to load print logs:', err);
    return [];
  }
}

export function logPrintEvent({ purpose = 'UNKNOWN', status = 'UNKNOWN', method = 'UNKNOWN', formattedText = '', targetPrinter = 'DEFAULT', error = null, orderId = null }) {
  const newLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    purpose, // 'KOT' | 'RECEIPT'
    status, // 'SENT' | 'WEB_FALLBACK' | 'RAWBT_INTENT' | 'ERROR'
    method, // 'TCP' | 'BLUETOOTH' | 'USB' | 'RAWBT' | 'PC_CONNECTOR' | 'WEB_POPUP'
    formattedText,
    targetPrinter,
    error: error ? (typeof error === 'string' ? error : error.message || String(error)) : null,
    orderId
  };

  try {
    const current = getPrintLogs();
    const updated = [newLog, ...current].slice(0, MAX_LOGS);
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(updated));
    listeners.forEach((fn) => fn(updated));
  } catch (err) {
    console.warn('Failed to save print log:', err);
  }

  return newLog;
}

export function clearPrintLogs() {
  try {
    localStorage.removeItem(LOG_STORAGE_KEY);
    listeners.forEach((fn) => fn([]));
  } catch (err) {
    console.warn('Failed to clear print logs:', err);
  }
}

export function subscribePrintLogs(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
