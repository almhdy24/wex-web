import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function Toast({ toast, onDismiss }) {
  const Icon = ICONS[toast.type] || ICONS.info;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${styles.toast} ${styles[toast.type] || styles.info}`}
    >
      <span className={styles.icon}>
        <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className={styles.message}>{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          className={styles.actionBtn}
          onClick={() => {
            if (toast.action.onClick) toast.action.onClick();
            onDismiss(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        className={styles.closeBtn}
        onClick={() => onDismiss(toast.id)}
        aria-label="إغلاق التنبيه"
      >
        <X size={16} strokeWidth={1.75} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
