import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function Toast({ toast, onDismiss }) {
  const Icon = ICONS[toast.type] || ICONS.info;
  const duration = toast.duration || 4000;

  const [remainingTime, setRemainingTime] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const lastTickRef = useRef(Date.now());

  // Reset remaining time if toast count changes (deduplication update)
  useEffect(() => {
    setRemainingTime(duration);
    lastTickRef.current = Date.now();
  }, [toast.count, duration]);

  // Timer loop with pause support
  useEffect(() => {
    if (duration <= 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      if (!isPaused) {
        setRemainingTime((prev) => {
          const next = prev - delta;
          if (next <= 0) {
            clearInterval(interval);
            onDismiss(toast.id);
            return 0;
          }
          return next;
        });
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPaused, duration, onDismiss, toast.id]);

  const handleMouseEnter = () => {
    lastTickRef.current = Date.now();
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    lastTickRef.current = Date.now();
    setIsPaused(false);
  };

  const handleFocus = () => {
    lastTickRef.current = Date.now();
    setIsPaused(true);
  };

  const handleBlur = () => {
    lastTickRef.current = Date.now();
    setIsPaused(false);
  };

  // Touch & Swipe handlers
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length > 0) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      lastTickRef.current = Date.now();
      setIsPaused(true);
    }
  };

  const handleTouchMove = (e) => {
    if (touchStartXRef.current === null || !e.touches || e.touches.length === 0) return;
    const diffX = e.touches[0].clientX - touchStartXRef.current;
    const diffY = e.touches[0].clientY - touchStartYRef.current;

    // Primarily horizontal swipe
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setSwipeOffset(diffX);
    }
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    lastTickRef.current = Date.now();
    if (Math.abs(swipeOffset) > 60) {
      onDismiss(toast.id);
    } else {
      setSwipeOffset(0);
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const progressPercent = duration > 0 ? Math.max(0, Math.min(100, (remainingTime / duration) * 100)) : 100;
  const isError = toast.type === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`${styles.toast} ${styles[toast.type] || styles.info}`}
      style={{
        transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : undefined,
        opacity: swipeOffset !== 0 ? Math.max(0.2, 1 - Math.abs(swipeOffset) / 150) : undefined,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.iconWrapper}>
        <Icon size={20} strokeWidth={2.25} aria-hidden="true" />
      </div>

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <span className={styles.title}>{toast.title || toast.message}</span>
          {toast.count > 1 && (
            <span className={styles.countBadge} aria-label={`تكرر ${toast.count} مرات`}>
              ×{toast.count}
            </span>
          )}
        </div>
        {toast.detail && <div className={styles.detail}>{toast.detail}</div>}
      </div>

      {toast.action && (
        <button
          type="button"
          className={styles.actionBtn}
          onClick={() => {
            if (toast.action.onClick) toast.action.onClick();
            onDismiss(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      )}

      <button
        type="button"
        className={styles.closeBtn}
        onClick={() => onDismiss(toast.id)}
        aria-label="إغلاق التنبيه"
        title="إغلاق"
      >
        <X size={18} strokeWidth={2} />
      </button>

      {duration > 0 && (
        <div className={styles.progressBarContainer} aria-hidden="true">
          <div
            className={styles.progressBarFill}
            style={{ '--progress-width': `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
