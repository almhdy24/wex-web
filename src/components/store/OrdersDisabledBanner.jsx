import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ar } from '../../content/ar';
import styles from './OrdersDisabledBanner.module.css';

export default function OrdersDisabledBanner({ message }) {
  const displayMessage = message || ar.ordersDisabled.defaultMessage;

  return (
    <div className={styles.banner} role="alert" aria-live="polite">
      <div className={styles.iconWrap} aria-hidden="true">
        <AlertCircle size={22} />
      </div>
      <div className={styles.content}>
        <div className={styles.title}>{ar.ordersDisabled.bannerTitle}</div>
        <div className={styles.message}>{displayMessage}</div>
      </div>
    </div>
  );
}
