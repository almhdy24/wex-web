import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, getServerTimeOffset, setMemoryAccessToken } from '../api/client';

const res = (headers) => ({
  ok: true,
  status: 200,
  headers: new Headers({ 'content-type': 'application/json', ...headers }),
  json: async () => ({ success: true, message: '', data: {}, errors: null, meta: null }),
});

// WEB-TIME-01: a stale cached response (SW stale-while-revalidate) must not move the
// server clock used by the price-lock countdown.
describe('server clock offset', () => {
  beforeEach(() => setMemoryAccessToken(null));

  it('uses fresh no-store responses and ignores cacheable/cached ones', async () => {
    const ahead = new Date(Date.now() + 60_000).toUTCString();
    global.fetch = vi.fn().mockResolvedValueOnce(res({ date: ahead, 'cache-control': 'no-store, no-cache' }));
    await apiClient('/orders/WEX-1');
    const fresh = getServerTimeOffset();
    expect(fresh).toBeGreaterThan(55_000);
    expect(fresh).toBeLessThan(65_000);

    const stale = new Date(Date.now() - 12 * 3600_000).toUTCString();
    global.fetch = vi.fn().mockResolvedValueOnce(res({ date: stale }));
    await apiClient('/products');
    expect(getServerTimeOffset()).toBe(fresh);
  });
});
