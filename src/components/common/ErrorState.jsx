import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from './Button';
import styles from './ErrorState.module.css';

export default function ErrorState({
  title = 'حصل خطأ في التحميل',
  message = 'الاتصال ضعيف. حاول تاني.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`${styles.wrapper} ${className}`} role="alert">
      <div className={styles.iconBox} aria-hidden="true">
        <AlertCircle size={26} strokeWidth={1.75} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          icon={RotateCcw}
          onClick={onRetry}
          className={styles.retryBtn}
        >
          حاول تاني
        </Button>
      )}
    </div>
  );
}
