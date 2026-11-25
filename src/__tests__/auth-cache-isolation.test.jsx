/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useEffect } from 'react';

vi.mock('../api/auth', () => ({
  authApi: { logout: vi.fn().mockResolvedValue({}), logoutAll: vi.fn().mockResolvedValue({}), getMe: vi.fn() },
}));
vi.mock('../utils/push', () => ({ unsubscribeFromDevice: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../api/client', async (orig) => {
  const actual = await orig();
  return {
    ...actual,
    performTokenRefresh: vi.fn().mockRejectedValue(new actual.ApiError('x', 401)),
  };
});

import { AuthProvider, useAuth } from '../context/AuthContext';
import { swrCache } from '../utils/swrCache';

// WEB-AUTH-01: per-user SWR data ('my_orders') survived logout/login on the same tab.
describe('auth cache isolation', () => {
  beforeEach(() => swrCache.clear());

  it('logout clears cached orders of the previous account', async () => {
    let auth;
    function Probe() {
      const ctx = useAuth();
      useEffect(() => { auth = ctx; });
      return null;
    }
    render(<AuthProvider><Probe /></AuthProvider>);

    swrCache.set('my_orders', [{ order_number: 'WEX-A-1' }]);
    await act(async () => { await auth.logout(); });
    expect(swrCache.get('my_orders')).toBeNull();
  });

  it('logging in a different account clears cached orders', async () => {
    let auth;
    function Probe() {
      const ctx = useAuth();
      useEffect(() => { auth = ctx; });
      return null;
    }
    render(<AuthProvider><Probe /></AuthProvider>);

    swrCache.set('my_orders', [{ order_number: 'WEX-A-1' }]);
    await act(async () => { auth.loginWithSession({ id: 2, name: 'ب', role: 'customer' }, 'tok'); });
    expect(swrCache.get('my_orders')).toBeNull();
  });
});
