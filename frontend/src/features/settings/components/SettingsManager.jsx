import { useState } from 'react';
import { BusinessProfileForm } from './BusinessProfileForm';
import { ZoneTableManager } from '../../zones/components/ZoneTableManager';
import { StaffManager } from '../../auth/components/StaffManager';
import { DiscountRulesManager } from '../../discounts/components/DiscountRulesManager';
import { Building2, LayoutGrid, Users, Tag } from 'lucide-react';
import styles from './SettingsManager.module.css';

export function SettingsManager() {
  const [activeSubTab, setActiveSubTab] = useState('PROFILE'); // 'PROFILE' | 'ZONES' | 'DISCOUNTS' | 'STAFF'

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>System Settings & Configuration</h2>
          <p className={styles.subtitle}>Configure store business profile, tax fallbacks, discount rules, zone pricing, and staff accounts</p>
        </div>
      </div>

      {/* Sub-Tabs Bar */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabBtn} ${activeSubTab === 'PROFILE' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('PROFILE')}
        >
          <Building2 size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Business Profile & Tax
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
      </div>

      {/* Sub-Tab Views */}
      {activeSubTab === 'PROFILE' && <BusinessProfileForm />}
      {activeSubTab === 'DISCOUNTS' && <DiscountRulesManager />}
      {activeSubTab === 'ZONES' && <ZoneTableManager />}
      {activeSubTab === 'STAFF' && <StaffManager />}
    </div>
  );
}
