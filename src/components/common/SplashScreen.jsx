import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ar } from '../../content/ar';
import styles from './SplashScreen.module.css';

/**
 * WEX Brand Loading Screen & First-Impression Experience
 *
 * Designed to represent WEX Technology with world-class e-commerce elegance.
 * - Zero artificial minimum delay: exits immediately once critical initialization completes (isReady=true)
 * - Safety ceiling timeout: ensures slow networks or API hangs never trap the customer
 * - Pre-hydration and layout-shift prevention: aligns with root canvas
 * - Full Arabic RTL support and refined bilingual typography
 * - Accessible: supports reduced motion, semantic status role, and keyboard escape
 */
export default function SplashScreen({
  isReady = false,
  onFinish,
  maxWaitMs = 2200,
  showSlowNoticeAfterMs = 750,
}) {
  const [isExiting, setIsExiting] = useState(false);
  const [showSlowNotice, setShowSlowNotice] = useState(false);
  const exitCalledRef = useRef(false);

  const handleClose = useCallback(() => {
    if (exitCalledRef.current) return;
    exitCalledRef.current = true;
    setIsExiting(true);

    const isReduced =
      typeof document !== 'undefined' &&
      (document.documentElement.getAttribute('data-motion') === 'reduced' ||
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);

    const exitDuration = isReduced ? 0 : 240;

    setTimeout(() => {
      try {
        sessionStorage.setItem('wex_splash_shown', 'true');
      } catch {
        // ignore storage errors
      }
      if (onFinish) onFinish();
    }, exitDuration);
  }, [onFinish]);

  // Reactive dismissal: when data readiness is signaled, exit without delay
  useEffect(() => {
    if (isReady) {
      handleClose();
    }
  }, [isReady, handleClose]);

  // Safety ceiling: never lock user out if API is slow or hangs
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      handleClose();
    }, maxWaitMs);

    return () => clearTimeout(safetyTimer);
  }, [maxWaitMs, handleClose]);

  // Slow network notice: show polite reassurance if initialization exceeds threshold
  useEffect(() => {
    const noticeTimer = setTimeout(() => {
      setShowSlowNotice(true);
    }, showSlowNoticeAfterMs);

    return () => clearTimeout(noticeTimer);
  }, [showSlowNoticeAfterMs]);

  // Keyboard accessibility: Escape or Enter allows immediate proceed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  return (
    <aside
      className={`${styles.splashContainer} ${isExiting ? styles.exit : ''}`}
      role="status"
      aria-live="polite"
      aria-label={ar.splash.ariaLabel || ar.splash.title}
      onClick={handleClose}
    >
      <div className={styles.ambientGlow} aria-hidden="true" />

      <div className={styles.contentWrapper} onClick={(e) => e.stopPropagation()}>
        {/* WEX Vector Brand Monogram */}
        <div className={styles.brandMarkWrapper}>
          <svg
            className={styles.brandMarkSvg}
            viewBox="0 0 128 128"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="wexSplashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0B3FBF" />
                <stop offset="100%" stopColor="#1E6BFF" />
              </linearGradient>
            </defs>
            <rect width="128" height="128" rx="28" fill="url(#wexSplashGrad)" />
            <path
              d="M26 40 L44 92 L58 56 L68 78 L84 40 L96 40 L76 92 L62 60 L50 92 L18 40 Z"
              fill="#FFFFFF"
            />
            <circle cx="96" cy="44" r="6" fill="#00B7FF" />
          </svg>
        </div>

        {/* Refined Brand Identity */}
        <div className={styles.brandIdentity}>
          <span className={styles.brandEn}>{ar.splash.brandEn || 'WEX TECHNOLOGY'}</span>
          <h1 className={styles.brandTitle}>{ar.splash.title}</h1>
          <p className={styles.brandSubtitle}>{ar.splash.subtitle}</p>
        </div>

        {/* Location & Store Origin Badge */}
        <div className={styles.locationBadge} aria-label={ar.splash.location}>
          <span className={styles.locationDot} aria-hidden="true" />
          <span className={styles.locationText}>{ar.splash.location}</span>
        </div>

        {/* Minimal Hairline Progress State */}
        <div className={styles.progressArea}>
          <div className={styles.hairlineTrack} role="progressbar" aria-label={ar.common.loading}>
            <div className={styles.hairlineThumb} />
          </div>

          <div className={styles.statusRow}>
            {showSlowNotice && (
              <span className={styles.slowNotice}>{ar.splash.initializing}</span>
            )}
          </div>
        </div>

        {/* Polite Skip Action (for accessibility or user control) */}
        <button
          type="button"
          className={styles.dismissAction}
          onClick={handleClose}
          aria-label={ar.splash.skip}
        >
          {ar.splash.skip}
        </button>
      </div>
    </aside>
  );
}
