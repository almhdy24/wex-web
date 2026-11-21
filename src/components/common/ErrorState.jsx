import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from './Button';
import styles from './ErrorState.module.css';

export default function ErrorState({
  title = 'حصل خطأ في التحميل',
  message = 'حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى.',
  onRetry,
  className = '',
}) {
  // Sanitize any raw JS error messages that may have leaked
  const cleanMessage = (/is not a function|undefined|null|NaN|\[object|Failed to fetch|Network Error/i.test(message))
    ? 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً'
    : message;

  return (
    <div className={`${styles.wrapper} ${className}`} role="alert">
      <div className={styles.iconBox} aria-hidden="true">
        <AlertCircle size={26} strokeWidth={1.75} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{cleanMessage}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          icon={RotateCcw}
          onClick={onRetry}
          className={styles.retryBtn}
        >
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
