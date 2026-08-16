import { useState, useEffect } from 'react';
import { listStaffApi, createStaffApi, toggleStaffStatusApi, updateStaffApi, resetStaffPasswordApi } from '../api/auth.api';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { KeyRound, ShieldAlert, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import styles from './StaffManager.module.css';

export function StaffManager() {
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [activeResetMember, setActiveResetMember] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('WAITER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadStaff = async () => {
    try {
      setIsLoading(true);
      const data = await listStaffApi();
      setStaffList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await createStaffApi({ username, password, role });
      setUsername('');
      setPassword('');
      setRole('WAITER');
      setShowAddModal(false);
      await loadStaff();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await toggleStaffStatusApi(id, !currentStatus);
      await loadStaff();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangeRole = async (id, newRole) => {
    try {
      await updateStaffApi(id, { role: newRole });
      await loadStaff();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!activeResetMember || !newPassword) return;
    setIsSubmitting(true);
    try {
      await resetStaffPasswordApi(activeResetMember.id, newPassword);
      setShowResetModal(false);
      setNewPassword('');
      setActiveResetMember(null);
      alert(`Password successfully reset for ${activeResetMember.username}!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Staff & Account Role Management</h2>
          <p className={styles.subtitle}>Create staff accounts, assign roles (Admin, Waiter, Kitchen, Counter), and reset passwords</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <UserPlus size={16} /> Add New Staff Member
        </Button>
      </div>

      {error && <div className={styles.errorAlert}>{error}</div>}

      {isLoading ? (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loading staff list...</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Assigned Role</th>
                <th>Account Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((member) => (
                <tr key={member.id}>
                  <td><strong>{member.username}</strong></td>
                  <td>
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(member.id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--color-border)',
                        fontWeight: 700,
                        fontSize: 'var(--text-xs)'
                      }}
                    >
                      <option value="WAITER">WAITER</option>
                      <option value="KITCHEN">KITCHEN</option>
                      <option value="COUNTER">COUNTER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td>
                    <span className={member.isActive ? styles.activeBadge : styles.inactiveBadge}>
                      {member.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setActiveResetMember(member);
                          setNewPassword('');
                          setShowResetModal(true);
                        }}
                        style={{ padding: '4px 8px', fontSize: 'var(--text-xs)' }}
                      >
                        <KeyRound size={14} /> Reset Pass
                      </Button>

                      <Button
                        variant={member.isActive ? 'danger' : 'primary'}
                        onClick={() => handleToggleStatus(member.id, member.isActive)}
                        style={{ padding: '4px 8px', fontSize: 'var(--text-xs)' }}
                      >
                        {member.isActive ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: Create Staff Member */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3>Add New Staff Member Account</h3>
            <form onSubmit={handleCreateStaff} className={styles.form}>
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. kitchen_chef"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
              />
              <div className={styles.selectWrapper}>
                <label className={styles.label}>Role Permission</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={styles.select}
                >
                  <option value="WAITER">WAITER (Floor order-taking & bill service)</option>
                  <option value="KITCHEN">KITCHEN (Orders board prep display)</option>
                  <option value="COUNTER">COUNTER (Checkout & billing reconciliation)</option>
                  <option value="ADMIN">ADMIN (Full system access & settings)</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Reset Staff Password */}
      {showResetModal && activeResetMember && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3>Reset Password for {activeResetMember.username}</h3>
            <form onSubmit={handleResetPassword} className={styles.form}>
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
              <div className={styles.modalActions}>
                <Button type="button" variant="secondary" onClick={() => setShowResetModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Set New Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
