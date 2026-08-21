import { useState } from 'react';
import { BusinessProfileForm } from './BusinessProfileForm';
import { PrintersSettingsForm } from './PrintersSettingsForm';
import { ZoneTableManager } from '../../zones/components/ZoneTableManager';
import { StaffManager } from '../../auth/components/StaffManager';
import { DiscountRulesManager } from '../../discounts/components/DiscountRulesManager';
import { AboutSection } from './AboutSection';
import { Building2, Printer, LayoutGrid, Users, Tag, Info } from 'lucide-react';
import styles from './SettingsManager.module.css';

export function SettingsManager() {
  const [activeSubTab, setActiveSubTab] = useState('PROFILE'); // 'PROFILE' | 'PRINTERS' | 'ZONES' | 'DISCOUNTS' | 'STAFF' | 'ABOUT'

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>System Settings & Configuration</h2>
          <p className={styles.subtitle}>Configure store business profile, thermal printers, tax modes, discount rules, zone pricing, and staff accounts</p>
        </div>
      </div>

      {/* Sub-Tabs Bar */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabBtn} ${activeSubTab === 'PROFILE' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('PROFILE')}
        >
          <Building2 size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Business Profile
        </button>

        <button
          className={`${styles.tabBtn} ${activeSubTab === 'PRINTERS' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('PRINTERS')}
        >
          <Printer size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Thermal Printers & KOT
        </button>

        <button
          className={`${styles.tabBtn} ${activeSubTab === 'DISCOUNTS' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('DISCOUNTS')}
        >
          <Tag size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Automatic Discount Rules
        </button>

        <button
          className={`${styles.tabBtn} ${activeSubTab === 'ZONES' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('ZONES')}
        >
          <LayoutGrid size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Zones & Tables Pricing
        </button>

        <button
          className={`${styles.tabBtn} ${activeSubTab === 'STAFF' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('STAFF')}
        >
          <Users size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Staff Accounts & Roles
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
      {activeSubTab === 'PRINTERS' && <PrintersSettingsForm />}
      {activeSubTab === 'DISCOUNTS' && <DiscountRulesManager />}
      {activeSubTab === 'ZONES' && <ZoneTableManager />}
      {activeSubTab === 'STAFF' && <StaffManager />}
      {activeSubTab === 'ABOUT' && <AboutSection />}
    </div>
  );
}
