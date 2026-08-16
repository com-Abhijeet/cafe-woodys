import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import styles from './LoginPage.module.css';

export function LoginPage({ onLoginSuccess }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setFormError('Please enter username and password');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const staff = await login(username, password);
      if (onLoginSuccess) {
        onLoginSuccess(staff);
      }
    } catch (err) {
      setFormError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Café Woody's</h1>
          <p className={styles.subtitle}>Tablet POS & Gaming Zone System</p>
        </div>

        {formError && <div className={styles.errorBanner}>{formError}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter staff username"
            required
            autoComplete="username"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isSubmitting}
            style={{ marginTop: 'var(--space-2)' }}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
