/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { safeReturnTo } from '../utils/url';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, role: 'customer' }, isAuthenticated: true, loading: false }),
}));

import { GuestRoute } from '../components/common/RouteGuard';

// WEB-SEC-01: open redirects via returnTo.
describe('safeReturnTo', () => {
  it('rejects backslash, encoded and scheme tricks', () => {
    for (const bad of ['/\\evil.example', '/\\/evil.example', '/%5Cevil.example', '/%2F%2Fevil.example', '//evil.example', 'https://evil.example', '/x?u=https://evil', '/%E0%A4%A']) {
      expect(safeReturnTo(bad, '/'), bad).toBe('/');
    }
  });

  it('keeps normal in-app paths', () => {
    expect(safeReturnTo('/checkout')).toBe('/checkout');
    expect(safeReturnTo('/orders/WEX-261125-BCD23?tab=1')).toBe('/orders/WEX-261125-BCD23?tab=1');
  });
});

describe('GuestRoute', () => {
  function Where() {
    const loc = useLocation();
    return <span data-testid="where">{loc.pathname}</span>;
  }

  it('does not follow an absolute returnTo for a signed-in user', () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/login?returnTo=https://evil.example/phish']}>
        <Routes>
          <Route path="/login" element={<GuestRoute><span>login</span></GuestRoute>} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(getByTestId('where').textContent).toBe('/');
  });
});

describe('validateSameOriginUrl (push deep links)', () => {
  it('rejects backslash paths that resolve cross-origin', async () => {
    const { validateSameOriginUrl } = await import('../utils/swPushHelpers');
    expect(validateSameOriginUrl('/\\evil.example/x', 'https://wex.sd')).toBe('/notifications');
    expect(validateSameOriginUrl('/orders/WEX-1?x=1#t', 'https://wex.sd')).toBe('/orders/WEX-1?x=1#t');
  });
});
