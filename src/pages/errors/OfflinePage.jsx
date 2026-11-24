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
      <h1 className={styles.title}>لا يوجد اتصال بالشبكة</h1>
      <p className={styles.message}>
        تعذّر الاتصال. يلزم الاتصال بالشبكة لعرض الأجهزة وتحديث الأسعار ومتابعة الطلبات.
      </p>
      <Button variant="primary" icon={RotateCcw} onClick={handleReload}>
        إعادة المحاولة
      </Button>
    </div>
  );
}
