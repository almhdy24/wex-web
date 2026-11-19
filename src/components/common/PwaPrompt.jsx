import React, { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';
import styles from './PwaPrompt.module.css';

export default function PwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = sessionStorage.getItem('wex_pwa_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('wex_pwa_dismissed', '1');
  };

  return (
    <>
      {isOffline && (
        <div className={styles.offlineBanner} role="status" aria-live="polite">
          <WifiOff size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>أنت شغال بدون إنترنت حالياً. بتشوف البيانات المحفوظة فقط.</span>
        </div>
      )}

      {showInstallBanner && deferredPrompt && (
        <div className={styles.installCard} role="dialog" aria-label="تثبيت التطبيق">
          <div className={styles.installInfo}>
            <img
              src="/icons/icon-192.png"
              alt=""
              className={styles.appIcon}
              width="40"
              height="40"
            />
            <div>
              <div className={styles.appName}>تطبيق ويكس تكنولوجي</div>
              <div className={styles.appDesc}>وصول أسرع ومتابعة لطلباتك</div>
            </div>
          </div>

          <div className={styles.installActions}>
            <button
              type="button"
              onClick={handleInstallClick}
              className={styles.installBtn}
            >
              تثبيت
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className={styles.dismissBtn}
              aria-label="إغلاق التنبيه"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
