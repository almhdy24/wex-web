import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, setMemoryAccessToken } from '../api/client';

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

describe('Central API Client Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setMemoryAccessToken(null);
    global.localStorage.clear();
    global.sessionStorage.clear();
  });

  it('unpacks standard successful JSON response', async () => {
    const mockPayload = {
      success: true,
      message: 'تمت العملية بنجاح',
      data: { id: 1, name: 'لابتوب ديل' },
      errors: null,
      meta: null,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockPayload,
    });

    const res = await apiClient('/products/1');
    expect(res.success).toBe(true);
    expect(res.data.id).toBe(1);
    expect(res.data.name).toBe('لابتوب ديل');
  });

  it('throws ApiError with Arabic message on 422 validation error', async () => {
    const mockErrorPayload = {
      success: false,
      message: 'فشل التحقق من البيانات',
      data: null,
      errors: {
        phone: 'يرجى إدخال رقم سوداني صحيح',
      },
      meta: null,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockErrorPayload,
    });

    await expect(apiClient('/me', { method: 'PATCH' })).rejects.toThrow('فشل التحقق من البيانات');
  });

  it('attaches Bearer access token from memory', async () => {
    setMemoryAccessToken('test-memory-jwt-token');

    let capturedHeaders = null;
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      capturedHeaders = opts.headers;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: { status: 'ok' } }),
      });
    });

    await apiClient('/ping');
    expect(capturedHeaders.get('Authorization')).toBe('Bearer test-memory-jwt-token');
  });

  it('does NOT set Content-Type if body is FormData', async () => {
    let capturedHeaders = null;
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      capturedHeaders = opts.headers;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: { uploaded: true } }),
      });
    });

    class FakeFormData {}
    const formData = new FakeFormData();
    global.FormData = FakeFormData;

    await apiClient('/orders/WEX-123/payment-proof', {
      method: 'POST',
      body: formData,
    });

    expect(capturedHeaders.has('Content-Type')).toBe(false);
  });
});
