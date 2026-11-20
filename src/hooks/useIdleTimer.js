import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_WARNING_MS = 25 * 60 * 1000; // 25 minutes
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * useIdleTimer
 * Detects user inactivity and alerts/logs out after specified thresholds.
 *
 * @param {Object} options
 * @param {Function} options.onTimeout - Callback when idle timeout is reached
 * @param {number} [options.warningMs=1500000] - Duration in ms before warning trigger (25m)
 * @param {number} [options.timeoutMs=1800000] - Duration in ms before logout trigger (30m)
 */
export function useIdleTimer({ onTimeout, warningMs = DEFAULT_WARNING_MS, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const [isWarning, setIsWarning] = useState(false);
  const warningTimerRef = useRef(null);
  const timeoutTimerRef = useRef(null);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    clearTimers();
    setIsWarning(false);

    if (typeof window === 'undefined') return;

    warningTimerRef.current = setTimeout(() => {
      setIsWarning(true);
    }, warningMs);

    timeoutTimerRef.current = setTimeout(() => {
      if (onTimeoutRef.current) {
        onTimeoutRef.current();
      }
    }, timeoutMs);
  }, [clearTimers, warningMs, timeoutMs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      // If warning is already shown, require explicit confirmation
      if (!isWarning) {
        resetTimer();
      }
    };

    events.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    resetTimer();

    return () => {
      clearTimers();
      events.forEach((evt) => {
        window.removeEventListener(evt, handleActivity);
      });
    };
  }, [resetTimer, clearTimers, isWarning]);

  return { isWarning, resetTimer };
}
