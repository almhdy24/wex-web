/**
 * Guarded gentle haptic feedback for key user interactions.
 * Safe across mobile browsers, desktop, and SSR/node environments.
 */
export function triggerHaptic(duration = 10) {
  if (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  ) {
    try {
      navigator.vibrate(duration);
    } catch {
      // Non-blocking fallback
    }
  }
}
