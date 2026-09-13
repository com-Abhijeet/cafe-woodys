import { useState } from 'react';
import { useSettingsContext } from '../../../context/SettingsContext';
import { BusinessProfileForm } from './BusinessProfileForm';
import { TaxSettingsForm } from './TaxSettingsForm';
import { PaymentSettingsForm } from './PaymentSettingsForm';
import { OrderSettingsForm } from './OrderSettingsForm';
import { GamingSettingsForm } from './GamingSettingsForm';
import { PrintersSettingsForm } from './PrintersSettingsForm';
import { LoyaltySettingsForm } from './LoyaltySettingsForm';
import { ZoneTableManager } from '../../zones/components/ZoneTableManager';
import { StaffManager } from '../../auth/components/StaffManager';
import { DiscountRulesManager } from '../../discounts/components/DiscountRulesManager';
import { AboutSection } from './AboutSection';
import { Building2, Percent, CreditCard, Clock, Gamepad2, Printer, Award, LayoutGrid, Users, Tag, Info, RotateCw, CheckCircle2 } from 'lucide-react';
import styles from './SettingsManager.module.css';

export function SettingsManager() {
  const [activeSubTab, setActiveSubTab] = useState('PROFILE');
  const { refreshSettings, isRefreshing, lastRefetched } = useSettingsContext();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>System Settings & Configuration</h2>
          <p className={styles.subtitle}>Configure store business profile, tax modes, UPI payment rules, order cancellation limits, gaming grace periods, thermal printers, loyalty rules, zone pricing, and staff accounts</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lastRefetched && (
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} style={{ color: 'var(--color-success)' }} />
              Auto-synced ({lastRefetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
            </div>
          )}
          <button
            type="button"
            onClick={() => refreshSettings()}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'var(--color-brand)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: 'var(--text-xs)',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              opacity: isRefreshing ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
            title="Refetch settings from server and sync across devices"
          >
            <RotateCw size={15} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Settings'}
          </button>
        </div>
      </div>

      {/* Sub-Tabs Bar */}
      <div className={styles.tabBar} style={{ flexWrap: 'wrap' }}>
        <button
          className={`${styles.tabBtn} ${activeSubTab === 'PROFILE' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('PROFILE')}
        >
          <Building2 size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Business Identity
        </button>

        <button
          className={`${styles.tabBtn} ${activeSubTab === 'TAX' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('TAX')}
        >
          <Percent size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Tax Settings
        </button>

        <button
          className={`${styles.tabBtn} ${activeSubTab === 'PAYMENT' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('PAYMENT')}
        >
          <CreditCard size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Payment Settings
        </button>

        <button
          className={`${styles.tabBtn} ${activeSubTab === 'ORDERS' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('ORDERS')}
        >
          <Clock size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Order Rules
        </button>

        <button
          className={`${styles.tabBtn} ${activeSubTab === 'GAMING' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('GAMING')}
        >
          <Gamepad2 size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Gaming Rules
        </button>

        <button
          className={`${styles.tabBtn} ${activeSubTab === 'PRINTERS' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('PRINTERS')}
        >
          <Printer size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Printers & KOT
        </button>

        <button
          className={`${styles.tabBtn} ${activeSubTab === 'LOYALTY' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('LOYALTY')}
        >
          <Award size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Loyalty Rules
        </button>

        <button
          className={`${styles.tabBtn} ${activeSubTab === 'DISCOUNTS' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('DISCOUNTS')}
        >
          <Tag size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Discount Rules
        </button>

        <button
          className={`${styles.tabBtn} ${activeSubTab === 'ZONES' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('ZONES')}
        >
          <LayoutGrid size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Zones & Tables
        </button>

        <button
          className={`${styles.tabBtn} ${activeSubTab === 'STAFF' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('STAFF')}
        >
          <Users size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Staff Accounts
        </button>

        <button
          className={`${styles.tabBtn} ${activeSubTab === 'ABOUT' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('ABOUT')}
        >
          <Info size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          About System
        </button>
      </div>

      {/* Sub-Tab Views */}
      {activeSubTab === 'PROFILE' && <BusinessProfileForm />}
      {activeSubTab === 'TAX' && <TaxSettingsForm />}
      {activeSubTab === 'PAYMENT' && <PaymentSettingsForm />}
      {activeSubTab === 'ORDERS' && <OrderSettingsForm />}
      {activeSubTab === 'GAMING' && <GamingSettingsForm />}
      {activeSubTab === 'PRINTERS' && <PrintersSettingsForm />}
      {activeSubTab === 'LOYALTY' && <LoyaltySettingsForm />}
      {activeSubTab === 'DISCOUNTS' && <DiscountRulesManager />}
      {activeSubTab === 'ZONES' && <ZoneTableManager />}
      {activeSubTab === 'STAFF' && <StaffManager />}
      {activeSubTab === 'ABOUT' && <AboutSection />}
    </div>
  );
}
