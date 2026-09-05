import { useState, useEffect } from 'react';
import { useBusinessProfile } from '../hooks/useBusinessProfile';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { ReceiptPreview } from './ReceiptPreview';
import { Building2, Check, AlertCircle } from 'lucide-react';
import styles from './SettingsManager.module.css';

export function BusinessProfileForm() {
  const { profile, isLoading, error, updateProfile } = useBusinessProfile();

  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [receiptFooterNote, setReceiptFooterNote] = useState('');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.businessName || '');
      setAddress(profile.address || '');
      setPhone(profile.phone || '');
      setEmail(profile.email || '');
      setGstin(profile.gstin || '');
      setFssaiNumber(profile.fssaiNumber || '');
      setLogoUrl(profile.logoUrl || '');
      setReceiptFooterNote(profile.receiptFooterNote || '');
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setSaveSuccess(false);
    setIsSubmitting(true);

    try {
      await updateProfile({
        businessName,
        address,
        phone,
        email,
        gstin,
        fssaiNumber,
        logoUrl,
        receiptFooterNote
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setActionError(err.message || 'Failed to save business profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loading business profile settings...</p>;
  }

  const liveProfileState = {
    businessName,
    address,
    phone,
    email,
    gstin,
    receiptFooterNote
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-4)', alignItems: 'start' }}>
      <form onSubmit={handleSubmit} className={styles.formSection}>
        {error && <div className={styles.errorMessage}><AlertCircle size={16} /> {error}</div>}
        {actionError && <div className={styles.errorMessage}><AlertCircle size={16} /> {actionError}</div>}
        {saveSuccess && <div className={styles.successMessage}><Check size={16} /> Business Profile saved!</div>}

        <h3 style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-brand)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building2 size={18} /> Store Identity & Receipt Branding
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-3)' }}>
          <Input
            label="Business Name (printed on receipts)"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            placeholder="e.g. Café Woody's"
          />

          <Input
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +91 98765 43210"
          />

          <Input
            label="Business Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@cafewoodys.com"
          />

          <Input
            label="GSTIN Number (Optional)"
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
            placeholder="e.g. 27AAAAA0000A1Z5"
          />

          <Input
            label="FSSAI License Number (Optional)"
            value={fssaiNumber}
            onChange={(e) => setFssaiNumber(e.target.value)}
            placeholder="e.g. 10020022000123"
          />
        </div>

        <Input
          label="Store Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. Shop 12, Main Market Road, Near City Center"
        />

        <Input
          label="Receipt Footer Thank-You Note"
          value={receiptFooterNote}
          onChange={(e) => setReceiptFooterNote(e.target.value)}
          placeholder="e.g. Thank you for visiting Café Woody's! Visit again."
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving Profile...' : 'Save Profile'}
          </Button>
        </div>
      </form>

      {/* Live Thermal Receipt Preview Panel */}
      <ReceiptPreview profile={liveProfileState} />
    </div>
  );
}
