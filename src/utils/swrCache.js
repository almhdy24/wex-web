/**
 * In-memory Stale-While-Revalidate (SWR) cache.
 * Provides instant render from cache on backward/forward navigation,
 * background revalidation, and request cancellation on unmount.
 */

const memoryCache = new Map();

export const swrCache = {
  get(key) {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    return entry;
  },
  set(key, data, ttlMs = 5 * 60 * 1000) {
    memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    });
  },
  delete(key) {
    memoryCache.delete(key);
  },
  clear() {
    memoryCache.clear();
  },
};
