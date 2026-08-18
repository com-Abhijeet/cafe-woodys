import { useState, useEffect } from 'react';
import { useBusinessProfile } from '../hooks/useBusinessProfile';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { ReceiptPreview } from './ReceiptPreview';
import { Building2, Percent, Check, AlertCircle, Clock, Printer, QrCode } from 'lucide-react';
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
  const [pricesIncludeTax, setPricesIncludeTax] = useState(false);
  const [thermalPaperWidth, setThermalPaperWidth] = useState('MM_80');
  const [upiId, setUpiId] = useState('');
  const [upiPayeeName, setUpiPayeeName] = useState('');
  const [autoMarkBillsPaidInFull, setAutoMarkBillsPaidInFull] = useState(false);

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
      setPricesIncludeTax(Boolean(profile.pricesIncludeTax));
      setThermalPaperWidth(profile.thermalPaperWidth || 'MM_80');
      setUpiId(profile.upiId || '');
      setUpiPayeeName(profile.upiPayeeName || '');
      setAutoMarkBillsPaidInFull(Boolean(profile.autoMarkBillsPaidInFull));
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
        printerIpAddress,
        pricesIncludeTax,
        thermalPaperWidth,
        upiId,
        upiPayeeName,
        autoMarkBillsPaidInFull
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
    receiptFooterNote,
    thermalPaperWidth,
    upiId,
    upiPayeeName
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-4)', alignItems: 'start' }}>
      <form onSubmit={handleSubmit} className={styles.formSection}>
        {error && <div className={styles.errorMessage}><AlertCircle size={16} /> {error}</div>}
        {actionError && <div className={styles.errorMessage}><AlertCircle size={16} /> {actionError}</div>}
        {saveSuccess && <div className={styles.successMessage}><Check size={16} /> Settings saved & preview updated!</div>}

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

          <Input
            label="Fallback System GST Rate (%)"
            type="number"
            step="0.1"
            value={defaultGstPercent}
            onChange={(e) => setDefaultGstPercent(e.target.value)}
            required
            placeholder="e.g. 5"
          />

          <Input
            label="WiFi Thermal Printer IP Address"
            value={printerIpAddress}
            onChange={(e) => setPrinterIpAddress(e.target.value)}
            placeholder="e.g. 192.168.1.100"
          />

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '4px', color: 'var(--color-text-primary)' }}>
              Thermal Paper Roll Width (Phase 16)
            </label>
            <select
              value={thermalPaperWidth}
              onChange={(e) => setThermalPaperWidth(e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                fontWeight: 600,
                fontSize: 'var(--text-xs)'
              }}
            >
              <option value="MM_80">80mm Roll Width (~48 chars/line - Standard POS)</option>
              <option value="MM_58">58mm Roll Width (~32 chars/line - Compact Receipt)</option>
            </select>
          </div>
        </div>

        {/* UPI Payment Configuration */}
        <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginTop: 'var(--space-3)' }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--color-brand)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <QrCode size={16} /> UPI Dynamic QR Payment Settings (Phase 16)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2)' }}>
            <Input
              label="Store UPI VPA ID (e.g. cafewoodys@okicici)"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="cafewoodys@okicici"
            />
            <Input
              label="UPI Store Payee Name"
              value={upiPayeeName}
              onChange={(e) => setUpiPayeeName(e.target.value)}
              placeholder="Cafe Woodys"
            />
          </div>
        </div>

        {/* Phase 16 Tax & Billing Defaults */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
          <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 'bold', cursor: 'pointer', fontSize: 'var(--text-xs)' }}>
              <input
                type="checkbox"
                checked={pricesIncludeTax}
                onChange={(e) => setPricesIncludeTax(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
              />
              Menu prices include GST (Tax-Inclusive Pricing Mode)
            </label>
          </div>

          <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 'bold', cursor: 'pointer', fontSize: 'var(--text-xs)' }}>
              <input
                type="checkbox"
                checked={autoMarkBillsPaidInFull}
                onChange={(e) => setAutoMarkBillsPaidInFull(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
              />
              Default new bills to instantly mark paid in full (Quick Checkout)
            </label>
          </div>
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
            {isSubmitting ? 'Saving Settings...' : 'Save Settings'}
          </Button>
        </div>
      </form>

      {/* Live Thermal Receipt Preview Panel */}
      <ReceiptPreview profile={liveProfileState} />
    </div>
  );
}
