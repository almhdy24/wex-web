/**
 * @vitest-environment jsdom
 *
 * ui-check: every store route after '/' hung (networkidle never) with three authenticated GETs
 * opened ~50 ms into the navigation. Two app bugs behind it:
 *  1. The reactivation refresh ran on visibilitychange→hidden (`visible || navigator.onLine`),
 *     rotating the refresh token while the tab was hidden or the page was unloading.
 *  2. isAuthenticated is true from the cached profile at once, so layout-level fetches went
 *     out before the bootstrap refresh had a token (401, refresh, retry on every load).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../api/auth', () => ({
  authApi: { logout: vi.fn(), logoutAll: vi.fn(), getMe: vi.fn().mockResolvedValue({ data: { id: 5, name: 'أ', role: 'customer' } }) },
}));
vi.mock('../utils/push', () => ({ unsubscribeFromDevice: vi.fn() }));
vi.mock('../api/client', async (orig) => {
  const actual = await orig();
  return { ...actual, performTokenRefresh: vi.fn().mockResolvedValue('tok') };
});
vi.mock('../api/orders', () => ({ ordersApi: { getOrders: vi.fn().mockResolvedValue({ data: [] }) } }));

import { performTokenRefresh } from '../api/client';
import { ordersApi } from '../api/orders';
import { AuthProvider } from '../context/AuthContext';
import { AuthContext } from '../context/AuthContext';
import PendingOrderBanner from '../components/common/PendingOrderBanner';

const setVisibility = (state) =>
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });

describe('session refresh on tab visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('wex_user', JSON.stringify({ id: 5, name: 'أ', role: 'customer' }));
  });
  afterEach(() => {
    localStorage.clear();
    setVisibility('visible');
  });

  it('guest (no cached profile): no refresh request on load or on tab focus', async () => {
    localStorage.clear();
    render(<AuthProvider><div /></AuthProvider>);
    await act(async () => { await Promise.resolve(); });
    setVisibility('visible');
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(performTokenRefresh).not.toHaveBeenCalled();
  });

  it('does not refresh when the page becomes hidden; does when it becomes visible', async () => {
    render(<AuthProvider><div /></AuthProvider>);
    await act(async () => { await Promise.resolve(); });
    const afterBootstrap = performTokenRefresh.mock.calls.length; // the mount refresh

    setVisibility('hidden');
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(performTokenRefresh.mock.calls.length).toBe(afterBootstrap);

    setVisibility('visible');
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(performTokenRefresh.mock.calls.length).toBe(afterBootstrap + 1);
  });
});

describe('layout fetches wait for the session bootstrap', () => {
  beforeEach(() => vi.clearAllMocks());

  const renderBanner = (auth) =>
    render(
      <MemoryRouter initialEntries={['/orders']}>
        <AuthContext.Provider value={auth}>
          <PendingOrderBanner />
        </AuthContext.Provider>
      </MemoryRouter>
    );

  it('cached profile but bootstrap still running: no orders request yet', async () => {
    renderBanner({ isAuthenticated: true, loading: true, user: { id: 5 } });
    await act(async () => { await Promise.resolve(); });
    expect(ordersApi.getOrders).not.toHaveBeenCalled();
  });

  it('bootstrap done: orders requested once', async () => {
    renderBanner({ isAuthenticated: true, loading: false, user: { id: 5 } });
    await act(async () => { await Promise.resolve(); });
    expect(ordersApi.getOrders).toHaveBeenCalledTimes(1);
  });
});
