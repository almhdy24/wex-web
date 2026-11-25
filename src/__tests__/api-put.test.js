import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, setMemoryAccessToken } from '../api/client';
import { pushApi } from '../api/push';

// WEB-API-01: api.put was missing, so every PUT call threw
// "TypeError: api.put is not a function" (push preferences, admin push
// settings, product image reorder).
describe('api.put', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setMemoryAccessToken(null);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true, message: '', data: { ok: true }, errors: null, meta: null }),
    });
  });

  it('exists and sends a JSON PUT', async () => {
    expect(typeof api.put).toBe('function');
    await api.put('/push/preferences', { order_updates: false });
    const [url, init] = global.fetch.mock.calls[0];
    expect(String(url)).toMatch(/\/push\/preferences$/);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ order_updates: false });
  });

  it('pushApi.updatePreferences no longer throws', async () => {
    await expect(pushApi.updatePreferences({ announcements: true })).resolves.toBeDefined();
  });
});

// WEB-API-02: a refresh that fails because the network is down must not be
// reported to the UI as "session expired" (401).
describe('401 retry when refresh fails offline', () => {
  it('surfaces the network error (status 0), not 401', async () => {
    const { apiClient: client, _resetRefreshState } = await import('../api/client');
    _resetRefreshState();
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({ success: false, message: 'x' }) })
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(client('/me')).rejects.toMatchObject({ status: 0 });
  });
});
