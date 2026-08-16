import { Bell, X } from 'lucide-react';
import styles from './Toast.module.css';

export function Toast({ toast, onClose, onView }) {
  return (
    <div className={styles.toast}>
      <div className={styles.content}>
        <Bell size={18} color="var(--color-brand)" />
        <span>{toast.message}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {toast.targetTab && onView && (
          <button
            className={styles.actionBtn}
            onClick={() => {
              onView(toast.targetTab);
              onClose(toast.id);
            }}
          >
            View
          </button>
        )}

        <button className={styles.closeBtn} onClick={() => onClose(toast.id)}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onCloseToast, onViewTab }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={onCloseToast}
          onView={onViewTab}
        />
      ))}
    </div>
  );
}
