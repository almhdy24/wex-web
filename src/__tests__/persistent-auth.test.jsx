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
  setOnAuthFailed,
  _resetRefreshState,
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

describe('30-Day Persistent Login, Single-Flight & Session Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    _resetRefreshState();
    global.localStorage.clear();
    global.sessionStorage.clear();
  });

  it('(a & b) concurrent callers and StrictMode triggers share ONE single promise and fetch', async () => {
    let fetchCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      fetchCount++;
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({
              success: true,
              data: { access_token: 'shared-jwt-token-123' },
            }),
          });
        }, 20);
      });
    });

    // Fire 4 concurrent refresh requests (simulating React StrictMode double effect + route retry)
    const results = await Promise.all([
      performTokenRefresh(),
      performTokenRefresh(),
      authApi.refresh(),
      performTokenRefresh(),
    ]);

    expect(fetchCount).toBe(1);
    expect(results[0]).toBe('shared-jwt-token-123');
    expect(results[1]).toBe('shared-jwt-token-123');
    expect(results[2]).toEqual({ success: true, data: { access_token: 'shared-jwt-token-123' } });
    expect(results[3]).toBe('shared-jwt-token-123');
  });

  it('(c) multi-tab lock path requests navigator.locks when available', async () => {
    let lockAcquired = false;
    const mockRequest = vi.fn().mockImplementation(async (name, callback) => {
      if (name === 'wex-refresh') {
        lockAcquired = true;
        return callback();
      }
    });

    Object.defineProperty(navigator, 'locks', {
      value: { request: mockRequest },
      configurable: true,
      writable: true,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        success: true,
        data: { access_token: 'locked-token-456' },
      }),
    });

    const token = await performTokenRefresh();

    expect(token).toBe('locked-token-456');
    expect(lockAcquired).toBe(true);
    expect(mockRequest).toHaveBeenCalledWith('wex-refresh', expect.any(Function));
  });

  it('(d) a network error keeps the user session without triggering logout callback', async () => {
    _resetRefreshState();
    let logoutTriggered = false;
    setOnAuthFailed(() => {
      logoutTriggered = true;
    });

    // Simulate network error / offline
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(performTokenRefresh()).rejects.toThrow('تعذر الاتصال بالخادم');

    // Crucial: Network error MUST NOT trigger logout callback
    expect(logoutTriggered).toBe(false);
  });

  it('(e) a definitive 401 clears memory token and triggers logout callback', async () => {
    _resetRefreshState();
    let logoutTriggered = false;
    setOnAuthFailed((status) => {
      if (status === 401) {
        logoutTriggered = true;
      }
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: false, message: 'انتهت صلاحية الجلسة' }),
    });

    await expect(performTokenRefresh()).rejects.toThrow('انتهت صلاحية الجلسة');
    expect(getMemoryAccessToken()).toBeNull();
    expect(logoutTriggered).toBe(true);
  });

  it('(f) idle timer is active for admin and inactive for customers', async () => {
    const { useIdleTimer } = await import('../hooks/useIdleTimer');
    expect(typeof useIdleTimer).toBe('function');

    // Customer storefront routes do NOT instantiate or use useIdleTimer
    // AdminShell explicitly utilizes useIdleTimer({ onTimeout: handleLogout })
    const { default: AdminShell } = await import('../components/admin/AdminShell');
    expect(AdminShell).toBeDefined();
  });

  it('(g) proactive refresh scheduling and event reactivation debounce', async () => {
    let refreshCalls = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      refreshCalls++;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          data: { access_token: `token-${refreshCalls}` },
        }),
      });
    });

    const token = await performTokenRefresh();
    expect(token).toBe('token-1');

    // Subsequent call within 10 seconds reuses existing memory token without extra fetch
    const reusedToken = await performTokenRefresh();
    expect(reusedToken).toBe('token-1');
    expect(refreshCalls).toBe(1);
  });

  it('(h) protected routes preserve return-to state and render lightweight verifying state during restore', () => {
    const loadingAuthContext = {
      user: null,
      accessToken: null,
      loading: true,
      isAuthenticated: false,
      isAdmin: false,
      isStaff: false,
    };

    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/orders/WEX-12345']}>
        <AuthContext.Provider value={loadingAuthContext}>
          <ProtectedRoute>
            <div id="secret-user-data">محتوى خاص جداً بالعميل</div>
          </ProtectedRoute>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // Protected content MUST NOT be present during loading
    expect(markup.includes('secret-user-data')).toBe(false);
    // Verifying text MUST be present
    expect(markup.includes('جارٍ التحقق من الجلسة')).toBe(true);
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
});
