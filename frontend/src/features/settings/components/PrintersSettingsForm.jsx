import { useState, useEffect } from 'react';
import {
  fetchPrinterConfigsApi,
  createPrinterConfigApi,
  updatePrinterConfigApi,
  deletePrinterConfigApi
} from '../api/printerConfigs.api';
import {
  fetchKitchenPrintSettingsApi,
  updateKitchenPrintSettingsApi
} from '../api/kitchenPrintSettings.api';
import {
  fetchBusinessProfileApi,
  updateBusinessProfileApi
} from '../api/businessProfile.api';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { Printer, Plus, Trash2, Edit2, Check, AlertCircle, ToggleLeft, ToggleRight, Wifi, Usb, Cpu, FileText } from 'lucide-react';
import styles from './SettingsManager.module.css';

export function PrintersSettingsForm() {
  const [printers, setPrinters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Phase 21 Step 3: Kitchen Print Settings State
  const [kitchenSettings, setKitchenSettings] = useState({
    printOnEveryOrder: false,
    printWithParcelBill: false
  });

  // Phase 22 Step 3: Business Profile Print & Pay Automation State
  const [profileSettings, setProfileSettings] = useState({
    alwaysSaveAndPrint: false,
    autoMarkBillsPaidInFull: false
  });

  // Form State for Add / Edit Modal
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('BILLING');
  const [connectionType, setConnectionType] = useState('TCP');
  const [ipAddress, setIpAddress] = useState('192.168.1.100');
  const [paperWidthMm, setPaperWidthMm] = useState('80');
  const [charsPerLineOverride, setCharsPerLineOverride] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [printersData, ksData, bpData] = await Promise.all([
        fetchPrinterConfigsApi(),
        fetchKitchenPrintSettingsApi(),
        fetchBusinessProfileApi().catch(() => null)
      ]);
      setPrinters(printersData || []);
      if (ksData) setKitchenSettings(ksData);
      if (bpData) setProfileSettings(bpData);
    } catch (err) {
      setError(err.message || 'Failed to load printer configurations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateKitchenSetting = async (key, value) => {
    try {
      const updated = await updateKitchenPrintSettingsApi({ [key]: value });
      setKitchenSettings(updated);
      setSaveSuccess('Kitchen print settings updated!');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenAddForm = () => {
    setEditingId(null);
    setName('');
    setPurpose('KITCHEN');
    setConnectionType('TCP');
    setIpAddress('192.168.1.100');
    setPaperWidthMm('80');
    setCharsPerLineOverride('');
    setIsEnabled(true);
    setIsDefault(true);
    setShowFormModal(true);
  };

  const handleOpenEditForm = (p) => {
    setEditingId(p.id);
    setName(p.name);
    setPurpose(p.purpose);
    setConnectionType(p.connectionType);
    setIpAddress(p.ipAddress || '');
    setPaperWidthMm(p.paperWidthMm?.toString() || '80');
    setCharsPerLineOverride(p.charsPerLineOverride ? p.charsPerLineOverride.toString() : '');
    setIsEnabled(p.isEnabled);
    setIsDefault(p.isDefault);
    setShowFormModal(true);
  };

  const handleToggleEnable = async (p) => {
    try {
      await updatePrinterConfigApi(p.id, { isEnabled: !p.isEnabled });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this printer configuration?')) return;
    try {
      await deletePrinterConfigApi(id);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const payload = {
      name,
      purpose,
      connectionType,
      ipAddress: connectionType === 'TCP' ? ipAddress : null,
      paperWidthMm: parseInt(paperWidthMm, 10) || 80,
      charsPerLineOverride: charsPerLineOverride ? parseInt(charsPerLineOverride, 10) : null,
      isEnabled,
      isDefault
    };

    try {
      if (editingId) {
        await updatePrinterConfigApi(editingId, payload);
        setSaveSuccess('Printer updated successfully!');
      } else {
        await createPrinterConfigApi(payload);
        setSaveSuccess('New printer configuration added successfully!');
      }
      setShowFormModal(false);
      loadData();
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save printer configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const kitchenPrinter = printers.find((p) => p.purpose === 'KITCHEN');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Kitchen Print Automation Toggles (Phase 21 Step 3) */}
      <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-base)', color: 'var(--color-brand)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={18} /> Kitchen Print Automation Settings
          </h3>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            Configure when price-free preparation slips automatically print (routes to KITCHEN printer, falling back to BILLING printer)
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)' }}>
                Print Kitchen Slip Immediately on Every Order Submission
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                Covers waiters' dine-in orders and single-screen setups with no live kitchen display
              </div>
            </div>
            <button
              onClick={() => handleUpdateKitchenSetting('printOnEveryOrder', !kitchenSettings.printOnEveryOrder)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: kitchenSettings.printOnEveryOrder ? 'var(--color-success)' : 'var(--color-text-secondary)' }}
            >
              {kitchenSettings.printOnEveryOrder ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)' }}>
                Print Kitchen Prep Slip When Parcel Bill is Generated
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                Prints a packing/prep slip alongside the takeaway customer bill upon parcel checkout
              </div>
            </div>
            <button
              onClick={() => handleUpdateKitchenSetting('printWithParcelBill', !kitchenSettings.printWithParcelBill)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: kitchenSettings.printWithParcelBill ? 'var(--color-success)' : 'var(--color-text-secondary)' }}
            >
              {kitchenSettings.printWithParcelBill ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)' }}>
                Paper-Only Kitchen KOT Tracking (No Kitchen Display Screen)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                Rely purely on printed KOTs — kitchen readiness check is skipped before billing
              </div>
            </div>
            <button
              onClick={() => handleUpdateKitchenSetting('paperOnlyKitchenTracking', !kitchenSettings.paperOnlyKitchenTracking)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: kitchenSettings.paperOnlyKitchenTracking ? 'var(--color-success)' : 'var(--color-text-secondary)' }}
            >
              {kitchenSettings.paperOnlyKitchenTracking ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>
        </div>
      </div>

      {error && <div className={styles.errorMessage}><AlertCircle size={16} /> {error}</div>}
      {saveSuccess && <div className={styles.successMessage}><Check size={16} /> {saveSuccess}</div>}

      {/* Header & Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-brand)', fontWeight: 800 }}>
          Configured Thermal Printers ({printers.length})
        </h3>
        <Button onClick={handleOpenAddForm}>
          <Plus size={16} /> Add Thermal Printer
        </Button>
      </div>

      {/* Printers List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-3)' }}>
        {isLoading ? (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loading configured printers...</p>
        ) : printers.length === 0 ? (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>No dedicated printer configurations added yet.</p>
        ) : (
          printers.map((p) => (
            <div
              key={p.id}
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                borderLeft: `4px solid ${p.purpose === 'BILLING' ? 'var(--color-brand)' : 'var(--color-info)'}`,
                padding: 'var(--space-3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    Purpose: <strong>{p.purpose}</strong> {p.isDefault && <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>(Default)</span>}
                  </div>
                </div>

                <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: p.isEnabled ? 'rgba(39,174,96,0.15)' : 'rgba(120,120,120,0.15)', color: p.isEnabled ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                  {p.isEnabled ? 'ACTIVE' : 'DISABLED'}
                </span>
              </div>

              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {p.connectionType === 'TCP' ? <Wifi size={12} /> : <Usb size={12} />} Mode: {p.connectionType}
                </span>
                {p.connectionType === 'TCP' && <span>IP: {p.ipAddress || 'Unset'}</span>}
                <span>Width: {p.paperWidthMm}mm</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px', borderTop: '1px dashed var(--color-border)', paddingTop: '6px' }}>
                <button
                  onClick={() => handleOpenEditForm(p)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Printer Config Modal */}
      {showFormModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleSubmit} style={{ width: '90%', maxWidth: '480px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-brand)', fontWeight: 800 }}>
              {editingId ? 'Edit Printer Configuration' : 'Add Printer Configuration'}
            </h3>

            <Input
              label="Printer Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Counter Billing Printer or Kitchen KOT Printer"
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '4px' }}>Printer Purpose</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', fontWeight: 600 }}
                >
                  <option value="BILLING">BILLING (Customer Receipts)</option>
                  <option value="KITCHEN">KITCHEN (Prep / KOT Slips)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '4px' }}>Connection Type</label>
                <select
                  value={connectionType}
                  onChange={(e) => setConnectionType(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', fontWeight: 600 }}
                >
                  <option value="TCP">WiFi / LAN TCP IP (Port 9100)</option>
                  <option value="USB">Wired USB (Direct OTG Cable)</option>
                  <option value="BLUETOOTH">Bluetooth Thermal Printer</option>
                  <option value="RAWBT">RawBT Companion App (Android)</option>
                  <option value="SYSTEM_DEFAULT">PC Print Connector (OS Default)</option>
                </select>
              </div>
            </div>

            {connectionType === 'TCP' && (
              <Input
                label="WiFi / LAN Thermal Printer IP Address"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="e.g. 192.168.1.100"
                required
              />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Input
                label="Paper Roll Width (mm)"
                type="number"
                value={paperWidthMm}
                onChange={(e) => setPaperWidthMm(e.target.value)}
                required
              />
              <Input
                label="Chars Per Line Override"
                type="number"
                value={charsPerLineOverride}
                onChange={(e) => setCharsPerLineOverride(e.target.value)}
                placeholder="Auto formula"
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                />
                Enabled
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                />
                Set as Default for {purpose}
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-2)' }}>
              <Button type="button" variant="secondary" onClick={() => setShowFormModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
