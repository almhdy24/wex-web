import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for initial user state if any
    try {
      const storedUser = localStorage.getItem('wex_user');
      const storedToken = sessionStorage.getItem('wex_access_token');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (storedToken) {
        setAccessToken(storedToken);
      }
    } catch {
      // Ignore parse errors
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithSession = (userData, token, refreshToken) => {
    setUser(userData);
    setAccessToken(token);
    try {
      localStorage.setItem('wex_user', JSON.stringify(userData));
      sessionStorage.setItem('wex_access_token', token);
      if (refreshToken) {
        localStorage.setItem('wex_refresh_token', refreshToken);
      }
    } catch {
      // storage error
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    try {
      localStorage.removeItem('wex_user');
      sessionStorage.removeItem('wex_access_token');
      localStorage.removeItem('wex_refresh_token');
    } catch {
      // storage error
    }
  };

  const updateUserProfile = (updatedUser) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedUser };
      try {
        localStorage.setItem('wex_user', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        setAccessToken,
        loading,
        isAuthenticated: !!user,
        loginWithSession,
        logout,
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
