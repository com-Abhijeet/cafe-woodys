import { useAuth } from '../../hooks/useAuth';
import { LoginPage } from '../../features/auth/components/LoginPage';

export function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-brand)',
        fontSize: 'var(--text-lg)',
        fontWeight: 600
      }}>
        Loading Café Woody's...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'ADMIN') {
    return (
      <div style={{
        padding: 'var(--space-6)',
        textAlign: 'center',
        color: 'var(--color-danger)'
      }}>
        <h2>Access Restricted</h2>
        <p>You do not have permission to view this page ({requiredRole} role required).</p>
      </div>
    );
  }

  return children;
}
