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

// D-9: provider value identity must be stable across parent re-renders.
describe('AuthProvider value identity', () => {
  it('does not re-render memoised consumers when the parent re-renders', async () => {
    const React = await import('react');
    let consumerRenders = 0;
    const Consumer = React.memo(function Consumer() {
      useAuth();
      consumerRenders += 1;
      return null;
    });
    let bump;
    function Parent() {
      const [, setN] = React.useState(0);
      bump = () => setN((n) => n + 1);
      return <AuthProvider><Consumer /></AuthProvider>;
    }
    render(<Parent />);
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    const settled = consumerRenders;
    await act(async () => { bump(); });
    await act(async () => { bump(); });
    expect(consumerRenders).toBe(settled);
  });
});
