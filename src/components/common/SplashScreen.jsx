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
 * - Accessible: supports reduced motion, semantic status role, keyboard Escape/Enter and tap to skip
 * - Shows only brand facts: the real X mark, the name and what the shop sells (no location:
 *   the address is an admin setting and is shown where it matters, e.g. checkout)
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
      <div className={styles.contentWrapper}>
        {/* The real WEX "X" mark as a sub-1 KB vector: instant on slow mobile data. */}
        <svg
          className={styles.brandMark}
          viewBox="220 340 590 345"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          data-testid="wex-x-mark"
        >
          <defs>
            <linearGradient id="wexSplashBlue" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--wex-royal)" />
              <stop offset="100%" stopColor="#1E8BFF" />
            </linearGradient>
          </defs>
          <path className={styles.markNavy} d="M328 390 H445 L706 648 H575 Z" fill="#111833" />
          <path className={styles.markBlue} d="M230 675 C300 668 352 664 372 660 C470 590 560 520 640 452 C690 410 740 378 795 350 C740 352 690 354 662 356 C610 372 560 412 520 444 C420 524 320 600 230 675 Z" fill="url(#wexSplashBlue)" />
        </svg>

        <h1 className={styles.brandTitle}>{ar.splash.title}</h1>
        <span className={styles.brandEn}>{ar.splash.brandEn || 'WEX TECHNOLOGY'}</span>
        <p className={styles.brandSubtitle}>{ar.splash.subtitle}</p>

        <div className={styles.progressArea}>
          <div className={styles.hairlineTrack} role="progressbar" aria-label={ar.common.loading}>
            <div className={styles.hairlineThumb} />
          </div>
          <p className={styles.slowNotice} aria-hidden={!showSlowNotice}>
            {showSlowNotice ? ar.splash.initializing : '\u00a0'}
          </p>
        </div>
      </div>
    </aside>
  );
}
