import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authApi } from '../api/auth';
import { setMemoryAccessToken, setOnAuthFailed } from '../api/client';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const clearSession = useCallback(() => {
    clearRefreshTimer();
    setUser(null);
    setAccessTokenState(null);
    setMemoryAccessToken(null);

    // Clean up any legacy or stored tokens
    try {
      sessionStorage.removeItem('wex_access_token');
      localStorage.removeItem('wex_refresh_token');
      localStorage.removeItem('wex_user');
    } catch {
      // Storage unavailable
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
    // Access token lifetime is 15 minutes. Proactively refresh at 14 minutes (840s).
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const res = await authApi.refresh();
        if (res?.data?.access_token) {
          setAccessTokenState(res.data.access_token);
          setMemoryAccessToken(res.data.access_token);
          scheduleProactiveRefresh();
        }
      } catch {
        // If proactive refresh fails, subsequent requests will trigger 401 retry or logout
      }
    }, 14 * 60 * 1000);
  }, [clearRefreshTimer]);

  // Hook global 401 unrecoverable failure
  useEffect(() => {
    setOnAuthFailed(() => {
      clearSession();
    });
  }, [clearSession]);

  const loginWithSession = useCallback((userData, newAccessToken) => {
    setUser(userData);
    setAccessTokenState(newAccessToken);
    setMemoryAccessToken(newAccessToken);

    try {
      localStorage.setItem('wex_user', JSON.stringify(userData));
      // Remove any legacy tokens from web storage
      sessionStorage.removeItem('wex_access_token');
      localStorage.removeItem('wex_refresh_token');
    } catch {
      // Storage unavailable
    }

    scheduleProactiveRefresh();
  }, [scheduleProactiveRefresh]);

  // Initialize session on mount using HttpOnly cookie
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        // Attempt silent refresh via HttpOnly wex_refresh_token cookie
        const res = await authApi.refresh();
        if (res?.data && isMounted) {
          const { access_token, user: sessionUser } = res.data;
          setAccessTokenState(access_token);
          setMemoryAccessToken(access_token);

          if (sessionUser) {
            setUser(sessionUser);
            try {
              localStorage.setItem('wex_user', JSON.stringify(sessionUser));
            } catch {
              // ignore storage errors
            }
          } else {
            // Fetch fresh profile via /me
            const meRes = await authApi.getMe();
            if (meRes?.data && isMounted) {
              setUser(meRes.data);
              try {
                localStorage.setItem('wex_user', JSON.stringify(meRes.data));
              } catch {
                // ignore storage errors
              }
            }
          }

          scheduleProactiveRefresh();
        }
      } catch {
        // Refresh token missing, expired, or invalid -> start unauthenticated
        if (isMounted) {
          clearSession();
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
      await authApi.logout();
    } catch {
      // Continue clearing even if API call fails
    }
    clearSession();
  }, [clearSession]);

  const logoutAll = useCallback(async () => {
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

  return (
    <AuthContext.Provider
      value={{
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
      }}
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
