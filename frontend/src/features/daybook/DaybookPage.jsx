import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Calendar,
  Download,
  Settings,
  PlusCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  X,
  DollarSign,
  Clock,
  User,
  FileText
} from 'lucide-react';
import styles from './DaybookPage.module.css';
import CashMovementModal from './CashMovementModal';
import { apiClient, exportFileApi } from '../../lib/apiClient';

export default function DaybookPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [daybookData, setDaybookData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [initialCashRs, setInitialCashRs] = useState('');

  const fetchDaybook = async (date) => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient(`/daybook?date=${date}`);
      setDaybookData(data);
    } catch (err) {
      setError(err.message || 'Failed to load daybook data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDaybook(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleExportCsv = async () => {
    try {
      await exportFileApi(
        `/daybook/export?dateFrom=${selectedDate}&dateTo=${selectedDate}`,
        `daybook-${selectedDate}.csv`
      );
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  const handleCashMovementSubmit = async (payload) => {
    await apiClient('/cash-transactions', { method: 'POST', body: payload });
    fetchDaybook(selectedDate);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const paise = Math.round(parseFloat(initialCashRs || 0) * 100);
    try {
      await apiClient('/daybook/settings', { method: 'PUT', body: { initialCashBalance: paise } });
      setIsSettingsOpen(false);
      fetchDaybook(selectedDate);
    } catch (err) {
      alert(err.message || 'Failed to update initial cash balance');
    }
  };

  const openSettingsModal = async () => {
    try {
      const settings = await apiClient('/daybook/settings');
      setInitialCashRs(((settings.initialCashBalance || 0) / 100).toString());
      setIsSettingsOpen(true);
    } catch (err) {
      alert('Failed to fetch settings: ' + err.message);
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Action Header */}
      <header className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.titleIconBadge}>
            <Wallet size={24} color="var(--color-brand)" />
          </div>
          <div>
            <h2 className={styles.titleText}>Daybook & Cash Ledger</h2>
            <p className={styles.subtitleText}>Daily cash flow, opening/closing reconciliation & petty cash records</p>
          </div>
        </div>

        <div className={styles.headerControls}>
          <div className={styles.datePickerWrapper}>
            <Calendar size={16} className={styles.inputIcon} />
            <input
              type="date"
              className={styles.datePicker}
              value={selectedDate}
              onChange={handleDateChange}
            />
          </div>

          <button className={styles.exportBtn} onClick={handleExportCsv}>
            <Download size={15} /> Export CSV
          </button>

          <button className={styles.settingsBtn} onClick={openSettingsModal} title="Configure Initial Cash Balance">
            <Settings size={15} /> Setup Starting Cash
          </button>

          <button className={styles.addCashBtn} onClick={() => setIsCashModalOpen(true)}>
            <PlusCircle size={16} /> Add Cash Movement
          </button>
        </div>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Loading Daybook Records...</p>
        </div>
      ) : daybookData ? (
        <>
          {/* Summary Metric Cards */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>Opening Balance</span>
                <div className={styles.metricIconBox} style={{ backgroundColor: 'rgba(217, 119, 54, 0.15)', color: 'var(--color-brand)' }}>
                  <Wallet size={16} />
                </div>
              </div>
              <div className={styles.metricValue}>
                ₹{((daybookData.openingBalance || 0) / 100).toFixed(2)}
              </div>
              <span className={styles.metricSubtext}>Cash in register at start of day</span>
            </div>

            <div className={`${styles.metricCard} ${styles.inCard}`}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>Total Cash In</span>
                <div className={styles.metricIconBox} style={{ backgroundColor: 'rgba(74, 222, 128, 0.15)', color: '#4ade80' }}>
                  <ArrowDownRight size={18} />
                </div>
              </div>
              <div className={`${styles.metricValue} ${styles.inValue}`}>
                +₹{((daybookData.totalIn || 0) / 100).toFixed(2)}
              </div>
              <span className={styles.metricSubtext}>Sales receipts & cash float top-ups</span>
            </div>

            <div className={`${styles.metricCard} ${styles.outCard}`}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>Total Cash Out</span>
                <div className={styles.metricIconBox} style={{ backgroundColor: 'rgba(248, 113, 113, 0.15)', color: '#f87171' }}>
                  <ArrowUpRight size={18} />
                </div>
              </div>
              <div className={`${styles.metricValue} ${styles.outValue}`}>
                -₹{((daybookData.totalOut || 0) / 100).toFixed(2)}
              </div>
              <span className={styles.metricSubtext}>Expenses, refunds & cash draws</span>
            </div>

            <div className={`${styles.metricCard} ${styles.closingCard}`}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>Closing Cash Balance</span>
                <div className={styles.metricIconBox} style={{ backgroundColor: 'rgba(217, 119, 54, 0.25)', color: 'var(--color-brand)' }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className={`${styles.metricValue} ${styles.closingValue}`}>
                ₹{((daybookData.closingBalance || 0) / 100).toFixed(2)}
              </div>
              <span className={styles.metricSubtext}>Expected cash in drawer right now</span>
            </div>
          </div>

          {/* Transactions Table Section */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <div className={styles.tableTitleGroup}>
                <FileText size={18} color="var(--color-brand)" />
                <h3>Cash Transactions for {new Date(selectedDate).toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</h3>
              </div>
              <span className={styles.countBadge}>{daybookData.entries?.length || 0} Entries</span>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Staff / Ref</th>
                    <th style={{ textAlign: 'right' }}>Cash In (₹)</th>
                    <th style={{ textAlign: 'right' }}>Cash Out (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {daybookData.entries && daybookData.entries.length > 0 ? (
                    daybookData.entries.map((item) => {
                      const isCashIn = item.category === 'CASH_IN';
                      const formattedTime = new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <tr key={item.id}>
                          <td className={styles.timeCell}>
                            <div className={styles.flexCell}>
                              <Clock size={12} color="var(--color-text-secondary)" />
                              {formattedTime}
                            </div>
                          </td>
                          <td>
                            <span className={`${styles.typeBadge} ${isCashIn ? styles.badgeIn : styles.badgeOut}`}>
                              {item.type}
                            </span>
                          </td>
                          <td className={styles.descCell}>{item.description}</td>
                          <td className={styles.refCell}>
                            <div className={styles.flexCell}>
                              <User size={12} color="var(--color-text-secondary)" />
                              {item.staff || item.reference || '—'}
                            </div>
                          </td>
                          <td className={`${styles.amountCell} ${styles.amountIn}`}>
                            {isCashIn ? `+₹${(item.amount / 100).toFixed(2)}` : '—'}
                          </td>
                          <td className={`${styles.amountCell} ${styles.amountOut}`}>
                            {!isCashIn ? `-₹${(item.amount / 100).toFixed(2)}` : '—'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className={styles.emptyCell}>
                        <div className={styles.emptyState}>
                          <Wallet size={32} color="var(--color-text-secondary)" opacity={0.4} />
                          <p>No cash movements or sales recorded for this date.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* Cash Movement Modal */}
      <CashMovementModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        onSubmit={handleCashMovementSubmit}
      />

      {/* Setup Starting Cash Settings Modal */}
      {isSettingsOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsSettingsOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={20} color="var(--color-brand)" />
                <h3>Setup Daybook Starting Cash</h3>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsSettingsOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <p className={styles.modalSubtitle}>
              Configure default float amount present in register when opening a new day's shift.
            </p>

            <form onSubmit={handleSaveSettings} className={styles.modalForm}>
              <div className={styles.inputGroup}>
                <label>Initial Register Cash Float (₹)</label>
                <div className={styles.currencyInputWrapper}>
                  <span className={styles.currencyPrefix}>₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 2000.00"
                    value={initialCashRs}
                    onChange={(e) => setInitialCashRs(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsSettingsOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
