import React, { useState, useEffect } from 'react';
import { ar } from '../../content/ar';
import styles from './SplashScreen.module.css';

export default function SplashScreen({ onFinish }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Show splash for ~1.3s then gracefully transition to home (max 1.4s)
    const timer = setTimeout(() => {
      handleClose();
    }, 1300);

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
    }, 200);
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
        {/* Rotating X Mark Motif */}
        <svg
          className={styles.xMarkMotif}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M8 8L32 32M32 8L8 32"
            stroke="#00B7FF"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>

        <div className={styles.logoCard}>
          <img
            src="/assets/logo.png"
            alt={ar.common.appName}
            className={styles.logoImg}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <div>
          <p className={styles.locationText}>{ar.splash.location}</p>
        </div>

        <div className={styles.actionsArea}>
          <div className={styles.spinner} aria-label={ar.common.loading} />
          <button
            type="button"
            className={styles.skipBtn}
            onClick={handleClose}
          >
            {ar.splash.skip}
          </button>
        </div>
      </div>
    </div>
  );
}
