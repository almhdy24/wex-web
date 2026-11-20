import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'wex_motion_mode';

/**
 * Detects default motion mode based on hardware and user accessibility preferences.
 */
export function detectDefaultMotionMode() {
  if (typeof window === 'undefined') return 'full';

  // 1. Accessibility preference wins over everything
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'reduced';
  }

  // 2. Hardware / Network capability check for "lite"
  const nav = window.navigator;
  if (nav) {
    const memory = nav.deviceMemory; // GB of RAM
    const cores = nav.hardwareConcurrency;
    const conn = nav.connection;

    if (
      (typeof memory === 'number' && memory <= 2) ||
      (typeof cores === 'number' && cores <= 4) ||
      (conn && conn.saveData === true)
    ) {
      return 'lite';
    }
  }

  return 'full';
}

/**
 * Hook to manage motion preferences across the application.
 */
export function useMotionMode() {
  const [motionMode, setMotionModeState] = useState(() => {
    if (typeof window === 'undefined') return 'full';

    // Check localStorage preference first
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'full' || stored === 'lite' || stored === 'reduced') {
      return stored;
    }

    return detectDefaultMotionMode();
  });

  const applyMode = useCallback((mode) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-motion', mode);
    }
  }, []);

  const setMotionMode = useCallback((newMode) => {
    if (newMode !== 'full' && newMode !== 'lite' && newMode !== 'reduced') {
      return;
    }
    setMotionModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // Storage unavailable
    }
    applyMode(newMode);
  }, [applyMode]);

  // Apply on mount and listen to system prefers-reduced-motion changes
  useEffect(() => {
    applyMode(motionMode);

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handleChange = (e) => {
        const stored = localStorage.getItem(STORAGE_KEY);
        // Only override if user hasn't explicitly set another preference
        if (!stored) {
          const next = e.matches ? 'reduced' : detectDefaultMotionMode();
          setMotionModeState(next);
          applyMode(next);
        }
      };

      mediaQuery.addEventListener?.('change', handleChange);
      return () => mediaQuery.removeEventListener?.('change', handleChange);
    }
  }, [motionMode, applyMode]);

  return {
    motionMode,
    setMotionMode,
    isFull: motionMode === 'full',
    isLite: motionMode === 'lite',
    isReduced: motionMode === 'reduced',
  };
}
