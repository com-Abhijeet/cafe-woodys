import { useState } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { CustomerLoyaltyTab } from './CustomerLoyaltyTab';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { ListRow } from '../../../components/ui/ListRow';
import { Users, Search, Plus, Phone, Calendar, Receipt, MessageSquare, Award, Clock } from 'lucide-react';
import styles from './CustomerCRMManager.module.css';

export function CustomerCRMManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const { customers, isLoading, error, addCustomer, getCustomerProfile } = useCustomers(searchQuery);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeProfile, setActiveProfile] = useState(null);
  const [profileTab, setProfileTab] = useState('BILLS'); // 'BILLS' | 'LOYALTY' | 'SMS'

  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const totalCRMSpendPaise = customers.reduce((sum, c) => sum + (c.totalSpendPaise || 0), 0);
  const totalVisits = customers.reduce((sum, c) => sum + (c.visitCount || 0), 0);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setActionError('');
    setIsSubmitting(true);

    try {
      await addCustomer({ name, phone, notes });
      setName('');
      setPhone('');
      setNotes('');
      setShowAddModal(false);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openProfileModal = async (cust) => {
    try {
      const fullProfile = await getCustomerProfile(cust.id);
      setActiveProfile(fullProfile);
      setProfileTab('BILLS');
      setShowProfileModal(true);
    } catch (err) {
      alert(`Failed to load profile: ${err.message}`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Customer CRM Directory</h2>
          <p className={styles.subtitle}>Track returning customer visits, total spend history, loyalty points, and SMS dispatches</p>
        </div>
        <Button onClick={() => { setActionError(''); setShowAddModal(true); }}>
          <Plus size={16} /> Add Customer
        </Button>
      </div>

      {/* Summary Stats */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{customers.length}</span>
          <span className={styles.statLabel}>Total Registered Customers</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: 'var(--color-brand)' }}>
            {totalVisits}
          </span>
          <span className={styles.statLabel}>Total Visits / Bills</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: 'var(--color-success)' }}>
            ₹{(totalCRMSpendPaise / 100).toFixed(2)}
          </span>
          <span className={styles.statLabel}>Total Customer Lifetime Revenue</span>
        </div>
      </div>

      {/* Search Input Bar */}
      <div style={{ position: 'relative', width: '100%' }}>
        <Input
          placeholder="Search customers by name or phone number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '36px' }}
        />
        <Search size={16} color="var(--color-text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
      </div>

      {/* Customers List Rows */}
      {isLoading ? (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Searching customers...</p>
      ) : error ? (
        <p style={{ color: 'var(--color-danger)' }}>{error}</p>
      ) : customers.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--color-bg)', borderRadius: '8px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          No customers found matching search criteria.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {customers.map((cust) => (
            <ListRow
              key={cust.id}
              title={cust.name}
              subtitle={`📞 ${cust.phone}${cust.notes ? ` • Note: "${cust.notes}"` : ''}`}
              badgeText={`${cust.visitCount || 0} Visits`}
              badgeVariant="info"
              onClick={() => openProfileModal(cust)}
              fields={[
                { label: 'Phone', value: cust.phone },
                { label: 'Total Visits', value: `${cust.visitCount || 0} Visits` },
                { label: 'Lifetime Spend', value: `₹${((cust.totalSpendPaise || 0) / 100).toFixed(2)}` }
              ]}
            />
          ))}
        </div>
      )}

      {/* Modal 1: Add Customer */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3>Add New Customer Profile</h3>
            {actionError && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{actionError}</div>}
            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input label="Customer Full Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Rahul Sharma" />
              <Input label="Phone Number (+91)" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="e.g. +91 98765 43210" />
              <Input label="Preferences / VIP Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Prefers extra hot cold coffee, regular gaming visitor" />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Profile'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Customer Full Profile & History */}
      {showProfileModal && activeProfile && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '650px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--color-brand)' }}>{activeProfile.name}</h3>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  📞 {activeProfile.phone}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-success)' }}>
                  ₹{((activeProfile.totalSpendPaise || 0) / 100).toFixed(2)}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Lifetime Total Spend</div>
              </div>
            </div>

            {/* Profile Navigation Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setProfileTab('BILLS')}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: profileTab === 'BILLS' ? '2px solid var(--color-brand)' : '2px solid transparent',
                  color: profileTab === 'BILLS' ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                  fontWeight: profileTab === 'BILLS' ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Receipt size={15} /> Bills History ({activeProfile.bills?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setProfileTab('LOYALTY')}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: profileTab === 'LOYALTY' ? '2px solid #fbbf24' : '2px solid transparent',
                  color: profileTab === 'LOYALTY' ? '#fbbf24' : 'var(--color-text-secondary)',
                  fontWeight: profileTab === 'LOYALTY' ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Award size={15} /> Loyalty Points
              </button>

              <button
                type="button"
                onClick={() => setProfileTab('SMS')}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: profileTab === 'SMS' ? '2px solid var(--color-brand)' : '2px solid transparent',
                  color: profileTab === 'SMS' ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                  fontWeight: profileTab === 'SMS' ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <MessageSquare size={15} /> SMS Logs ({activeProfile.smsLogs?.length || 0})
              </button>
            </div>

            {/* Tab 1: Visit History Bills */}
            {profileTab === 'BILLS' && (
              <div>
                {activeProfile.bills?.length === 0 ? (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', padding: '16px 0' }}>No past bills recorded.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                    {activeProfile.bills.map((bill) => (
                      <div key={bill.id} style={{ backgroundColor: 'var(--color-bg)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                        <span>Bill #{bill.id.slice(-6).toUpperCase()} ({new Date(bill.createdAt).toLocaleDateString()})</span>
                        <span style={{ fontWeight: 700 }}>₹{(bill.grandTotal / 100).toFixed(2)} • {bill.paymentStatus}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Loyalty Points Ledger */}
            {profileTab === 'LOYALTY' && (
              <CustomerLoyaltyTab customerId={activeProfile.id} />
            )}

            {/* Tab 3: SMS Dispatches Log */}
            {profileTab === 'SMS' && (
              <div>
                {activeProfile.smsLogs?.length === 0 ? (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', padding: '16px 0' }}>No SMS dispatches sent yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                    {activeProfile.smsLogs.map((log) => (
                      <div key={log.id} style={{ backgroundColor: 'var(--color-bg)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                          <span style={{ color: log.status === 'SENT' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            Status: {log.status}
                          </span>
                          <span style={{ color: 'var(--color-text-secondary)' }}>
                            {new Date(log.sentAt).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          "{log.message}"
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
              <Button variant="secondary" onClick={() => setShowProfileModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
