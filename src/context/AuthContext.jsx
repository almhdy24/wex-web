import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { authApi } from '../api/auth';
import {
  setMemoryAccessToken,
  setOnAuthFailed,
  performTokenRefresh,
  broadcastAuthEvent,
  ApiError,
} from '../api/client';
import { unsubscribeFromDevice } from '../utils/push';
import { swrCache } from '../utils/swrCache';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Read non-sensitive cached user profile immediately to prevent UI flicker
  const [user, setUser] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem('wex_user');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object' && parsed.id) {
            return {
              id: parsed.id,
              name: parsed.name || '',
              role: parsed.role || 'customer',
              email: parsed.email || '',
              phone: parsed.phone || '',
            };
          }
        }
      } catch {
        // Storage unavailable or invalid JSON
      }
    }
    return null;
  });

  const [accessToken, setAccessTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);
  const lastActiveRefreshRef = useRef(0);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const clearSession = useCallback((shouldBroadcast = true) => {
    clearRefreshTimer();
    setUser(null);
    setAccessTokenState(null);
    setMemoryAccessToken(null);

    // Clean up stored session identifiers but NEVER wipe cart or form state!
    try {
      sessionStorage.removeItem('wex_access_token');
      localStorage.removeItem('wex_refresh_token');
      localStorage.removeItem('wex_refresh_token_fallback');
      localStorage.removeItem('wex_user');
    } catch {
      // Storage unavailable
    }

    // In-memory SWR cache holds per-user data (e.g. 'my_orders'); on a shared device the
    // next account must never be shown the previous account's orders.
    swrCache.clear();

    if (shouldBroadcast) {
      broadcastAuthEvent({ type: 'LOGOUT' });
    }

    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name.includes('api') || name.includes('wex-public-api-cache')) {
            caches.delete(name);
          }
        });
      }).catch(() => {});
    }
  }, [clearRefreshTimer]);

  const scheduleProactiveRefresh = useCallback(() => {
    clearRefreshTimer();
    // Access token lifetime is 15 minutes. Proactively refresh at ~80% (12 minutes / 720,000ms).
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const token = await performTokenRefresh();
        if (token) {
          setAccessTokenState(token);
          scheduleProactiveRefresh();
        }
      } catch (err) {
        // If proactive refresh fails due to network error, subsequent requests will retry; only 401 unauthenticates
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
        }
      }
    }, 12 * 60 * 1000);
  }, [clearRefreshTimer, clearSession]);

  // Hook global 401 unrecoverable failure
  useEffect(() => {
    setOnAuthFailed((status) => {
      if (status === 401) {
        clearSession(false);
      }
    });
  }, [clearSession]);

  // Cross-tab synchronization via BroadcastChannel
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      let ch;
      try {
        ch = new BroadcastChannel('wex-auth');
        ch.onmessage = (event) => {
          const msg = event?.data;
          if (msg?.type === 'REFRESH_SUCCESS' && msg?.access_token) {
            setAccessTokenState(msg.access_token);
          } else if (msg?.type === 'LOGIN' && msg?.user) {
            setUser(msg.user);
          } else if (msg?.type === 'LOGOUT') {
            clearSession(false);
          }
        };
      } catch {
        ch = null;
      }
      return () => {
        ch?.close();
      };
    }
  }, [clearSession]);

  // Proactive refresh on window focus, visibilitychange, and online events (debounced 60s)
  useEffect(() => {
    const handleReactivation = async () => {
      const now = Date.now();
      if (now - lastActiveRefreshRef.current < 60000) return;
      if (document.visibilityState === 'visible' || (typeof navigator !== 'undefined' && navigator.onLine)) {
        lastActiveRefreshRef.current = now;
        try {
          const token = await performTokenRefresh();
          if (token) {
            setAccessTokenState(token);
            scheduleProactiveRefresh();
          }
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
            clearSession();
          }
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleReactivation);
      window.addEventListener('online', handleReactivation);
      document.addEventListener('visibilitychange', handleReactivation);

      return () => {
        window.removeEventListener('focus', handleReactivation);
        window.removeEventListener('online', handleReactivation);
        document.removeEventListener('visibilitychange', handleReactivation);
      };
    }
  }, [scheduleProactiveRefresh, clearSession]);

  const loginWithSession = useCallback((userData, newAccessToken) => {
    swrCache.clear();
    setUser(userData);
    setAccessTokenState(newAccessToken);
    setMemoryAccessToken(newAccessToken);

    try {
      localStorage.setItem('wex_user', JSON.stringify(userData));
      sessionStorage.removeItem('wex_access_token');
      localStorage.removeItem('wex_refresh_token');
    } catch {
      // Storage unavailable
    }

    broadcastAuthEvent({ type: 'LOGIN', user: userData });
    scheduleProactiveRefresh();
  }, [scheduleProactiveRefresh]);

  // Initialize session on mount using HttpOnly cookie via single-flight performTokenRefresh
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const token = await performTokenRefresh();
        if (token && isMounted) {
          setAccessTokenState(token);

          // Fetch fresh profile via /me
          try {
            const meRes = await authApi.getMe();
            if (meRes?.data && isMounted) {
              setUser(meRes.data);
              try {
                localStorage.setItem('wex_user', JSON.stringify(meRes.data));
              } catch {
                // ignore storage errors
              }
            }
          } catch {
            // Profile fetch error: retain cached non-sensitive user profile
          }

          scheduleProactiveRefresh();
        }
      } catch (err) {
        // Only definitive 401 clears session. Network errors or 5xx preserve cached session!
        if (isMounted) {
          if (err instanceof ApiError && err.status === 401) {
            clearSession(false);
          } else if (err?.message?.includes('401') || err?.status === 401) {
            clearSession(false);
          }
          // Otherwise (network offline / server error), keep cached profile
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
      clearRefreshTimer();
    };
  }, [clearSession, scheduleProactiveRefresh, clearRefreshTimer]);

  const logout = useCallback(async () => {
    try {
      await unsubscribeFromDevice();
    } catch {
      // ignore push unsubscribe failure
    }
    try {
      await authApi.logout();
    } catch {
      // Continue clearing even if API call fails
    }
    clearSession();
  }, [clearSession]);

  const logoutAll = useCallback(async () => {
    try {
      await unsubscribeFromDevice();
    } catch {
      // ignore push unsubscribe failure
    }
    try {
      await authApi.logoutAll();
    } catch {
      // Continue clearing
    }
    clearSession();
  }, [clearSession]);

  const updateUserProfile = useCallback((updatedUserData) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedUserData };
      try {
        localStorage.setItem('wex_user', JSON.stringify(next));
      } catch {
        // ignore storage write errors
      }
      return next;
    });
  }, []);

  // Stable identity: a new object every render re-rendered every useAuth() consumer
  // whenever the provider's parent re-rendered.
  const value = useMemo(() => ({
    user,
    accessToken,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff' || user?.role === 'admin',
    loginWithSession,
    logout,
    logoutAll,
    updateUserProfile,
  }), [user, accessToken, loading, loginWithSession, logout, logoutAll, updateUserProfile]);

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
