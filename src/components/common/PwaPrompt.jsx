import React, { useState, useEffect } from 'react';
import { WifiOff, X, Share } from 'lucide-react';
import styles from './PwaPrompt.module.css';

export default function PwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for Service Worker update
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration?.().then((reg) => {
        if (!reg) return;
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
                setWaitingWorker(newWorker);
              }
            });
          }
        });
      }).catch(() => {});
    }

    const dismissed = sessionStorage.getItem('wex_pwa_dismissed');

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS Safari detection (beforeinstallprompt is not supported on iOS)
    const isIos = typeof navigator !== 'undefined' &&
      /iPhone|iPad|iPod/i.test(navigator.userAgent) &&
      !window.navigator.standalone;
    if (isIos && !dismissed) {
      setShowIosBanner(true);
    }

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

  const handleRefreshUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  return (
    <>
      {isOffline && (
        <div className={styles.offlineBanner} role="status" aria-live="polite">
          <WifiOff size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>أنت في وضع عدم الاتصال حالياً. يتم عرض البيانات المحفوظة فقط.</span>
        </div>
      )}

      {updateAvailable && (
        <div className={styles.updateCard} role="status" aria-live="polite">
          <span className={styles.updateText}>يتوفر تحديث جديد للمتجر</span>
          <button
            type="button"
            onClick={handleRefreshUpdate}
            className={styles.refreshBtn}
          >
            تحديث الآن
          </button>
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

      {showIosBanner && (
        <div className={styles.installCard} role="dialog" aria-label="تثبيت التطبيق على آيفون">
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
              <div className={styles.appDesc}>
                لتثبيت التطبيق: اضغط زر المشاركة <Share size={14} className={styles.inlineIcon} aria-hidden="true" /> ثم اختر <strong>إضافة إلى الشاشة الرئيسية</strong>
              </div>
            </div>
          </div>

          <div className={styles.installActions}>
            <button
              type="button"
              onClick={() => {
                setShowIosBanner(false);
                sessionStorage.setItem('wex_pwa_dismissed', '1');
              }}
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
