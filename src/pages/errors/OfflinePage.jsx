import React from 'react';
import { WifiOff, RotateCcw } from 'lucide-react';
import Button from '../../components/common/Button';
import styles from './OfflinePage.module.css';

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.iconBox} aria-hidden="true">
        <WifiOff size={32} strokeWidth={1.75} />
      </div>
      <h1 className={styles.title}>مافي اتصال بالإنترنت</h1>
      <p className={styles.message}>
        أنت غير متصل بالشبكة حالياً. المتجر محتاج اتصال لتحديث أسعار الأجهزة وحجزها ورفع إشعارات التحويل.
      </p>
      <Button variant="primary" icon={RotateCcw} onClick={handleReload}>
        حاول تاني
      </Button>
    </div>
  );
}
