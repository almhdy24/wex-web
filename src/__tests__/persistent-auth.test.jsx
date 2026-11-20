import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ProtectedRoute, RoleGuard } from '../components/common/RouteGuard';
import { authApi } from '../api/auth';
import {
  performTokenRefresh,
  getMemoryAccessToken,
  setMemoryAccessToken,
  setOnAuthFailed,
} from '../api/client';

const createStorageMock = () => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
};

global.localStorage = createStorageMock();
global.sessionStorage = createStorageMock();

describe('30-Day Persistent Login & Route Guarding Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setMemoryAccessToken(null);
    global.localStorage.clear();
    global.sessionStorage.clear();
  });

  it('guarantees protected routes do NOT render protected content while session is loading', () => {
    const loadingAuthContext = {
      user: null,
      accessToken: null,
      loading: true,
      isAuthenticated: false,
      isAdmin: false,
      isStaff: false,
    };

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <AuthContext.Provider value={loadingAuthContext}>
          <ProtectedRoute>
            <div id="secret-user-data">محتوى خاص جداً بالعميل</div>
          </ProtectedRoute>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // Protected content MUST NOT be present
    expect(markup.includes('secret-user-data')).toBe(false);
    expect(markup.includes('محتوى خاص جداً بالعميل')).toBe(false);
    // Skeleton should be rendered
    expect(markup.includes('loadingContainer')).toBe(true);
  });

  it('renders protected content once authentication finishes loading successfully', () => {
    const authenticatedAuthContext = {
      user: { id: 1, name: 'أحمد', role: 'customer' },
      accessToken: 'sample-access-jwt',
      loading: false,
      isAuthenticated: true,
      isAdmin: false,
      isStaff: false,
    };

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <AuthContext.Provider value={authenticatedAuthContext}>
          <ProtectedRoute>
            <div id="secret-user-data">محتوى خاص جداً بالعميل</div>
          </ProtectedRoute>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(markup.includes('secret-user-data')).toBe(true);
    expect(markup.includes('محتوى خاص جداً بالعميل')).toBe(true);
  });

  it('RoleGuard protects admin panel from customers and displays arabic message', () => {
    const customerAuthContext = {
      user: { id: 2, name: 'سارة', role: 'customer' },
      accessToken: 'customer-jwt',
      loading: false,
      isAuthenticated: true,
      isAdmin: false,
      isStaff: false,
    };

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <AuthContext.Provider value={customerAuthContext}>
          <RoleGuard allowedRoles={['admin']}>
            <div id="admin-panel">لوحة التحكم</div>
          </RoleGuard>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(markup.includes('admin-panel')).toBe(false);
    expect(markup.includes('هذه الصفحة مخصصة لإدارة المتجر')).toBe(true);
  });

  it('performTokenRefresh uses HttpOnly credentials without storing refresh tokens in web storage', async () => {
    let capturedOptions = null;
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      capturedOptions = opts;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          data: {
            access_token: 'new-in-memory-access-token',
            refresh_token: 'backend-rotated-token-for-mobile',
          },
        }),
      });
    });

    const token = await performTokenRefresh();

    expect(token).toBe('new-in-memory-access-token');
    expect(getMemoryAccessToken()).toBe('new-in-memory-access-token');
    expect(capturedOptions.credentials).toBe('include');

    // Strict constraint check: NO tokens in localStorage or sessionStorage
    expect(global.localStorage.getItem('wex_refresh_token')).toBeNull();
    expect(global.sessionStorage.getItem('wex_access_token')).toBeNull();
  });

  it('authApi.refresh and authApi.logout pass credentials and revoke session', async () => {
    let refreshOpts = null;
    let logoutOpts = null;

    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/auth/refresh')) {
        refreshOpts = opts;
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true, data: { access_token: 'tok-123' } }),
        });
      }
      if (url.includes('/auth/logout')) {
        logoutOpts = opts;
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true, data: null }),
        });
      }
      return Promise.reject(new Error('Unknown'));
    });

    await authApi.refresh();
    expect(refreshOpts.credentials).toBe('include');
    expect(JSON.parse(refreshOpts.body)).toEqual({});

    await authApi.logout();
    expect(logoutOpts.credentials).toBe('include');
    expect(JSON.parse(logoutOpts.body)).toEqual({});
  });

  it('unrecoverable refresh failure clears memory token and triggers auth failure callback', async () => {
    setMemoryAccessToken('stale-token');
    let authFailedCalled = false;
    setOnAuthFailed(() => {
      authFailedCalled = true;
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: false, message: 'انتهت صلاحية الجلسة' }),
    });

    await expect(performTokenRefresh()).rejects.toThrow('انتهت صلاحية الجلسة');
    expect(getMemoryAccessToken()).toBeNull();
    expect(authFailedCalled).toBe(true);
  });

  it('configures Axios withCredentials correctly for cross-origin Android cookies', async () => {
    const { axiosInstance } = await import('../api/axios');

    // withCredentials must be true to allow Android Chrome to transmit HttpOnly cookies
    expect(axiosInstance.defaults.withCredentials).toBe(true);
    expect(axiosInstance.defaults.headers['Accept']).toBe('application/json');

    // In-memory token attachment check
    setMemoryAccessToken('memory-jwt-token-123');
    const mockConfig = { headers: {} };
    const requestInterceptor = axiosInstance.interceptors.request.handlers[0].fulfilled;
    const transformedConfig = requestInterceptor(mockConfig);

    expect(transformedConfig.headers.Authorization).toBe('Bearer memory-jwt-token-123');
  });
});
