import { useState, useEffect } from 'react';
import { useBusinessProfile } from '../hooks/useBusinessProfile';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { Building2, Percent, Check, AlertCircle, Clock, Printer } from 'lucide-react';
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
  const [defaultGstPercent, setDefaultGstPercent] = useState('5');
  const [gamingGracePeriodMinutes, setGamingGracePeriodMinutes] = useState('5');
  const [printerIpAddress, setPrinterIpAddress] = useState('');

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
      setDefaultGstPercent(profile.defaultGstPercent?.toString() || '5');
      setGamingGracePeriodMinutes(profile.gamingGracePeriodMinutes?.toString() || '5');
      setPrinterIpAddress(profile.printerIpAddress || '');
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
        receiptFooterNote,
        defaultGstPercent: parseFloat(defaultGstPercent) || 0,
        gamingGracePeriodMinutes: parseInt(gamingGracePeriodMinutes, 10) || 5,
        printerIpAddress
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

  return (
    <form onSubmit={handleSubmit} className={styles.formSection}>
      {error && <div className={styles.errorMessage}><AlertCircle size={16} /> {error}</div>}
      {actionError && <div className={styles.errorMessage}><AlertCircle size={16} /> {actionError}</div>}
      {saveSuccess && <div className={styles.successMessage}><Check size={16} /> Business profile & printer settings updated successfully!</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
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

        <Input
          label="System Default Fallback GST Rate (%)"
          type="number"
          step="0.1"
          value={defaultGstPercent}
          onChange={(e) => setDefaultGstPercent(e.target.value)}
          required
          placeholder="e.g. 5"
        />

        <Input
          label="Gaming Slab Grace Window (Minutes)"
          type="number"
          value={gamingGracePeriodMinutes}
          onChange={(e) => setGamingGracePeriodMinutes(e.target.value)}
          required
          placeholder="e.g. 5"
        />

        <Input
          label="WiFi Thermal Printer Local IP Address (Phase 14)"
          value={printerIpAddress}
          onChange={(e) => setPrinterIpAddress(e.target.value)}
          placeholder="e.g. 192.168.1.100"
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

      <Input
        label="Logo URL (Cloudinary or Image URL)"
        value={logoUrl}
        onChange={(e) => setLogoUrl(e.target.value)}
        placeholder="https://res.cloudinary.com/..."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving Settings...' : 'Save Business Profile & Printer Settings'}
        </Button>
      </div>
    </form>
  );
}
