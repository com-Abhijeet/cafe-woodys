import { useState, useEffect } from 'react';
import { getPrintLogs, clearPrintLogs, subscribePrintLogs } from '../../../lib/print/printLogger';
import { Button } from '../../../components/ui/Button/Button';
import { Printer, FileText, Trash2, Search, Filter, CheckCircle2, AlertCircle, RefreshCw, X, Eye, Code } from 'lucide-react';
import styles from './SettingsManager.module.css';

export function PrintLogsScreen() {
  const [logs, setLogs] = useState([]);
  const [filterPurpose, setFilterPurpose] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    setLogs(getPrintLogs());
    const unsubscribe = subscribePrintLogs((updated) => setLogs(updated));
    return unsubscribe;
  }, []);

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all print execution logs?')) {
      clearPrintLogs();
      setSelectedLog(null);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterPurpose !== 'ALL' && log.purpose !== filterPurpose) return false;
    if (filterStatus !== 'ALL' && log.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = (log.formattedText || '').toLowerCase();
      const matchPrinter = (log.targetPrinter || '').toLowerCase();
      const matchErr = (log.error || '').toLowerCase();
      const matchId = (log.orderId || '').toLowerCase();
      if (!matchText.includes(q) && !matchPrinter.includes(q) && !matchErr.includes(q) && !matchId.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SENT':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(46, 125, 50, 0.15)', color: '#2E7D32' }}>
            <CheckCircle2 size={12} /> SENT
          </span>
        );
      case 'WEB_FALLBACK':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(201, 122, 59, 0.15)', color: 'var(--color-brand)' }}>
            <RefreshCw size={12} /> WEB FALLBACK
          </span>
        );
      case 'RAWBT_INTENT':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(59, 110, 201, 0.15)', color: 'var(--color-gaming-zone)' }}>
            <Printer size={12} /> RAWBT INTENT
          </span>
        );
      case 'ERROR':
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(211, 47, 47, 0.15)', color: '#D32F2F' }}>
            <AlertCircle size={12} /> ERROR
          </span>
        );
    }
  };

  return (
    <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', height: '100%', gap: '12px', backgroundColor: 'var(--color-bg)' }}>
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-surface)', padding: '12px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-brand)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={20} /> Thermal Printer & System Execution Logs
          </h2>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            Inspect real-time print commands, KOT auto-print triggers, payload texts, and device connection statuses
          </p>
        </div>
        <Button variant="secondary" onClick={handleClear} disabled={logs.length === 0} style={{ fontSize: 'var(--text-xs)', color: '#D32F2F', gap: '4px' }}>
          <Trash2 size={14} /> Clear Logs
        </Button>
      </div>

      {/* 2. Filter Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', backgroundColor: 'var(--color-surface)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-bg)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', flex: 1, minWidth: '200px' }}>
          <Search size={14} color="var(--color-text-secondary)" />
          <input
            type="text"
            placeholder="Search payload text, printer name, order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' }}
          />
          {searchQuery && (
            <X size={14} cursor="pointer" onClick={() => setSearchQuery('')} color="var(--color-text-secondary)" />
          )}
        </div>

        {/* Purpose Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={14} color="var(--color-text-secondary)" />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Type:</span>
          <select
            value={filterPurpose}
            onChange={(e) => setFilterPurpose(e.target.value)}
            style={{ padding: '6px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' }}
          >
            <option value="ALL">All Types</option>
            <option value="KOT">KOT Slips</option>
            <option value="RECEIPT">Customer Receipts</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '6px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="SENT">SENT (Success)</option>
            <option value="WEB_FALLBACK">WEB FALLBACK</option>
            <option value="RAWBT_INTENT">RAWBT INTENT</option>
            <option value="ERROR">ERROR</option>
          </select>
        </div>
      </div>

      {/* 3. Log List Table */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            <Printer size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
            <p style={{ margin: 0 }}>No print logs found matching the selected filters.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                <th style={{ padding: '10px 12px' }}>Timestamp</th>
                <th style={{ padding: '10px 12px' }}>Type</th>
                <th style={{ padding: '10px 12px' }}>Target Printer</th>
                <th style={{ padding: '10px 12px' }}>Connection Method</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px' }}>Payload Snapshot</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const dateStr = new Date(log.timestamp).toLocaleDateString();
                const snippet = (log.formattedText || '').split('\n').filter(Boolean).slice(0, 3).join(' | ');

                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.15s' }}>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700 }}>{timeStr}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{dateStr}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontWeight: 800, color: log.purpose === 'KOT' ? 'var(--color-brand)' : 'var(--color-gaming-zone)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {log.purpose === 'KOT' ? <FileText size={13} /> : <Printer size={13} />} {log.purpose}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{log.targetPrinter}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>{log.method}</td>
                    <td style={{ padding: '10px 12px' }}>{getStatusBadge(log.status)}</td>
                    <td style={{ padding: '10px 12px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                      {snippet || '(Empty payload)'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <Button variant="secondary" onClick={() => setSelectedLog(log)} style={{ fontSize: '11px', padding: '4px 8px', gap: '4px' }}>
                        <Eye size={12} /> Inspect Slip
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. Inspection Modal */}
      {selectedLog && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '520px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-modal)' }}>
            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-bg)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-brand)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Code size={16} /> {selectedLog.purpose} Print Inspection
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  {new Date(selectedLog.timestamp).toLocaleString()} • Method: {selectedLog.method}
                </span>
              </div>
              <X size={18} cursor="pointer" onClick={() => setSelectedLog(null)} color="var(--color-text-secondary)" />
            </div>

            {/* Content Body */}
            <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Meta Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: 'var(--color-bg)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '12px' }}>
                <div><strong>Status:</strong> {getStatusBadge(selectedLog.status)}</div>
                <div><strong>Printer:</strong> {selectedLog.targetPrinter}</div>
              </div>

              {selectedLog.error && (
                <div style={{ backgroundColor: 'rgba(211, 47, 47, 0.1)', border: '1px solid rgba(211, 47, 47, 0.3)', padding: '10px', borderRadius: 'var(--radius-md)', color: '#D32F2F', fontSize: '12px' }}>
                  <strong>Error Message:</strong> {selectedLog.error}
                </div>
              )}

              {/* Formatted Text Preview */}
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Formatted Thermal Receipt Payload Preview:
                </span>
                <pre style={{
                  backgroundColor: '#1E1E1E',
                  color: '#00FF66',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  lineHeight: '1.4',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                  maxHeight: '340px'
                }}>
                  {selectedLog.formattedText || '(No formatted text)'}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--color-border)', textAlign: 'right', backgroundColor: 'var(--color-bg)' }}>
              <Button variant="secondary" onClick={() => setSelectedLog(null)} style={{ fontSize: 'var(--text-xs)' }}>
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
