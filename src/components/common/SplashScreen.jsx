import React, { useState, useEffect } from 'react';
import styles from './SplashScreen.module.css';

export default function SplashScreen({ onFinish }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Show splash for ~1.2s then fade out
    const timer = setTimeout(() => {
      handleClose();
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      try {
        sessionStorage.setItem('wex_splash_shown', 'true');
      } catch {
        // ignore storage errors
      }
      if (onFinish) onFinish();
    }, 250);
  };

  return (
    <div
      className={`${styles.splashContainer} ${isExiting ? styles.exit : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="شاشة الترحيب"
    >
      <div className={styles.ribbonOne} aria-hidden="true" />
      <div className={styles.ribbonTwo} aria-hidden="true" />
      <div className={styles.ribbonThree} aria-hidden="true" />

      <div className={styles.contentWrapper}>
        <div className={styles.logoCard}>
          <img
            src="/assets/logo.png"
            alt="Wex Technology"
            className={styles.logoImg}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <div>
          <p className={styles.locationText}>مول الواحة - الشهداء</p>
        </div>

        <div className={styles.actionsArea}>
          <div className={styles.spinner} aria-label="جاري التحميل..." />
          <button
            type="button"
            className={styles.skipBtn}
            onClick={handleClose}
          >
            دخول المتجر ←
          </button>
        </div>
      </div>
    </div>
  );
}
