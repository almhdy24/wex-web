import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';
import { setMemoryAccessToken, setOnAuthFailed } from '../api/client';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessTokenState(null);
    setMemoryAccessToken(null);
    sessionStorage.removeItem('wex_access_token');
    localStorage.removeItem('wex_refresh_token');
    localStorage.removeItem('wex_user');

    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name.includes('api') || name.includes('wex-public-api-cache')) {
            caches.delete(name);
          }
        });
      }).catch(() => {});
    }
  }, []);

  // Hook global 401 unrecoverable failure
  useEffect(() => {
    setOnAuthFailed(() => {
      clearSession();
    });
  }, [clearSession]);

  const loginWithSession = useCallback((userData, newAccessToken, newRefreshToken) => {
    setUser(userData);
    setAccessTokenState(newAccessToken);
    setMemoryAccessToken(newAccessToken);

    try {
      localStorage.setItem('wex_user', JSON.stringify(userData));
      sessionStorage.setItem('wex_access_token', newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem('wex_refresh_token', newRefreshToken);
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      const storedToken = sessionStorage.getItem('wex_access_token');
      const storedRefreshToken = localStorage.getItem('wex_refresh_token');
      const storedUser = localStorage.getItem('wex_user');

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // ignore corrupted user JSON
        }
      }

      if (storedToken) {
        setAccessTokenState(storedToken);
        setMemoryAccessToken(storedToken);
      } else if (storedRefreshToken) {
        // Try refreshing on startup if access token expired/missing in session
        try {
          const res = await authApi.refresh(storedRefreshToken);
          if (res?.data && isMounted) {
            const { access_token, refresh_token } = res.data;
            setAccessTokenState(access_token);
            setMemoryAccessToken(access_token);
            sessionStorage.setItem('wex_access_token', access_token);
            if (refresh_token) {
              localStorage.setItem('wex_refresh_token', refresh_token);
            }
            // Fetch fresh /me
            const meRes = await authApi.getMe();
            if (meRes?.data && isMounted) {
              setUser(meRes.data);
              localStorage.setItem('wex_user', JSON.stringify(meRes.data));
            }
          }
        } catch {
          if (isMounted) clearSession();
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, [clearSession]);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('wex_refresh_token');
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Continue clearing even if API call fails
      }
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
