import React, { useState, useEffect } from 'react';

export default function PwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Online / Offline status listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA Install prompt listener
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user already dismissed recently
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
      {/* Offline Status Warning Banner */}
      {isOffline && (
        <div
          style={{
            backgroundColor: '#dc2626',
            color: '#ffffff',
            padding: '8px 16px',
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: '600',
            position: 'sticky',
            top: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
          أنت تعمل في وضع غير متصل بالإنترنت حالياً. يتم تصفح البيانات والصفحات المخزنة مسبقاً.
        </div>
      )}

      {/* PWA Install Promotion Banner */}
      {showInstallBanner && deferredPrompt && (
        <div
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '16px',
            right: '16px',
            maxWidth: '480px',
            margin: '0 auto',
            backgroundColor: '#061A55',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '14px 18px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            zIndex: 9990,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            border: '1px solid rgba(0, 183, 255, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/icons/icon-192.png"
              alt="Wex App Icon"
              style={{ width: '40px', height: '40px', borderRadius: '8px' }}
            />
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px' }}>تطبيق ويكس تكنولوجي</div>
              <div style={{ fontSize: '12px', opacity: 0.85 }}>
                تثبيت التطبيق على جهازك للوصول الأسرع ومتابعة الطلبات
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleInstallClick}
              style={{
                backgroundColor: 'var(--wex-cyan, #00B7FF)',
                color: '#061A55',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              تثبيت
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              style={{
                background: 'transparent',
                color: '#ffffff',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px',
                lineHeight: 1,
              }}
              title="إغلاق"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
