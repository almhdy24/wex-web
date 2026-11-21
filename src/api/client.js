/**
 * Wex Technology Central API Client
 *
 * Implements standard envelope unpacking, JWT refresh token rotation with single-flight
 * deduplication, error normalization with Arabic messages, and multipart FormData handling.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// In-memory access token storage (never stored in localStorage/sessionStorage)
let memoryAccessToken = null;
let refreshPromise = null;
let onAuthFailedCallback = null;
let lastRefreshTime = 0;
let authChannel = null;

function getAuthChannel() {
  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    if (!authChannel) {
      try {
        authChannel = new BroadcastChannel('wex-auth');
        authChannel.onmessage = (event) => {
          const msg = event?.data;
          if (msg?.type === 'REFRESH_SUCCESS' && msg?.access_token) {
            memoryAccessToken = msg.access_token;
            lastRefreshTime = msg.timestamp || Date.now();
          } else if (msg?.type === 'LOGOUT') {
            memoryAccessToken = null;
            if (typeof onAuthFailedCallback === 'function') {
              onAuthFailedCallback(401);
            }
          }
        };
      } catch {
        authChannel = null;
      }
    }
  }
  return authChannel;
}

export function broadcastAuthEvent(data) {
  try {
    const ch = getAuthChannel();
    if (ch) {
      ch.postMessage(data);
    }
  } catch {
    // Channel error
  }
}

export function setMemoryAccessToken(token) {
  memoryAccessToken = token;
  if (!token) {
    lastRefreshTime = 0;
  }
}

export function _resetRefreshState() {
  memoryAccessToken = null;
  refreshPromise = null;
  lastRefreshTime = 0;
}

export function getMemoryAccessToken() {
  return memoryAccessToken;
}

export function setOnAuthFailed(callback) {
  onAuthFailedCallback = callback;
}

export class ApiError extends Error {
  constructor(message, status, errors = null, data = null) {
    super(message || 'حدث خطأ في الاتصال بالخدمة');
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.data = data;
  }
}

/**
 * Cross-tab lock wrapper using Web Locks API when available with mutex fallback.
 */
async function withCrossTabLock(callback) {
  if (typeof navigator !== 'undefined' && navigator.locks && typeof navigator.locks.request === 'function') {
    return navigator.locks.request('wex-refresh', callback);
  }

  // Fallback: localStorage mutex
  if (typeof localStorage !== 'undefined') {
    const lockKey = 'wex_refresh_lock';
    const now = Date.now();
    const existing = localStorage.getItem(lockKey);
    if (existing && now - Number(existing) < 5000) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    localStorage.setItem(lockKey, String(Date.now()));
    try {
      return await callback();
    } finally {
      localStorage.removeItem(lockKey);
    }
  }

  return callback();
}

/**
 * Executes a token refresh request, sharing the promise across concurrent callers.
 * Web clients use HttpOnly cookie automatically; cross-tab lock prevents double rotation.
 */
export async function performTokenRefresh(optionalRefreshToken = null) {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      return await withCrossTabLock(async () => {
        // If another tab refreshed recently (within 10s), reuse fresh token
        if (memoryAccessToken && Date.now() - lastRefreshTime < 10000) {
          return memoryAccessToken;
        }

        const storageFallback = import.meta.env.VITE_AUTH_STORAGE_FALLBACK === 'true';
        let fallbackToken = null;
        if (storageFallback && typeof localStorage !== 'undefined') {
          fallbackToken = localStorage.getItem('wex_refresh_token_fallback');
        }

        const body = {};
        const tokenToUse = optionalRefreshToken || fallbackToken;
        if (tokenToUse) {
          body.refresh_token = tokenToUse;
        }
        if (storageFallback) {
          body.return_refresh_token = true;
        }

        let response;
        try {
          response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(body),
          });
        } catch {
          // Network failure or offline: keep user signed in, do NOT clear session!
          throw new ApiError('تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت', 0);
        }

        const envelope = await response.json().catch(() => null);

        // Only definitive 401 unauthenticates the customer
        if (response.status === 401) {
          memoryAccessToken = null;
          if (storageFallback && typeof localStorage !== 'undefined') {
            localStorage.removeItem('wex_refresh_token_fallback');
          }
          if (typeof onAuthFailedCallback === 'function') {
            onAuthFailedCallback(401);
          }
          broadcastAuthEvent({ type: 'LOGOUT' });
          throw new ApiError(envelope?.message || 'انتهت صلاحية جلسة الدخول، يرجى تسجيل الدخول مجدداً', 401);
        }

        // Temporary 5xx server errors or 429 rate limit: preserve session
        if (response.status >= 500 || response.status === 429) {
          throw new ApiError(envelope?.message || 'حدث خطأ مؤقت في الخادم، يرجى المحاولة لاحقاً', response.status);
        }

        if (!response.ok || !envelope?.success) {
          throw new ApiError(envelope?.message || 'تعذر تحديث جلسة الدخول', response.status);
        }

        const { access_token, refresh_token: newReturnedRefreshToken } = envelope.data;
        memoryAccessToken = access_token;
        lastRefreshTime = Date.now();

        if (storageFallback && newReturnedRefreshToken && typeof localStorage !== 'undefined') {
          localStorage.setItem('wex_refresh_token_fallback', newReturnedRefreshToken);
        }

        broadcastAuthEvent({
          type: 'REFRESH_SUCCESS',
          access_token,
          timestamp: lastRefreshTime,
        });

        return access_token;
      });
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Core HTTP Request Method
 *
 * @param {string} endpoint e.g. '/products' or full URL
 * @param {object} options fetch options
 * @param {boolean} retryOn401 whether this request can retry once on 401
 */
export async function apiClient(endpoint, options = {}, retryOn401 = true) {
  const isAbsolute = endpoint.startsWith('http://') || endpoint.startsWith('https://');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = isAbsolute ? endpoint : `${API_BASE_URL}${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});

  // Set Accept header
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Handle Content-Type: do NOT set if body is FormData!
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach Bearer token from React memory if available
  const token = memoryAccessToken;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const credentialsMode = options.withCredentials !== undefined
    ? (options.withCredentials ? 'include' : 'same-origin')
    : (options.credentials || 'include');

  try {
    const response = await fetch(url, {
      ...options,
      credentials: credentialsMode,
      headers,
    });

    // Handle 401 Unauthorized for authenticated endpoints
    if (response.status === 401 && retryOn401 && !url.includes('/auth/refresh') && !url.includes('/auth/email/verify')) {
      try {
        const newAccessToken = await performTokenRefresh();
        // Retry once with new access token
        const newHeaders = new Headers(options.headers || {});
        newHeaders.set('Authorization', `Bearer ${newAccessToken}`);
        if (!isFormData && options.body && !newHeaders.has('Content-Type')) {
          newHeaders.set('Content-Type', 'application/json');
        }
        return await apiClient(endpoint, {
          ...options,
          credentials: credentialsMode,
          headers: newHeaders,
        }, false);
      } catch {
        throw new ApiError('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً', 401);
      }
    }

    // Check for Binary Stream response (e.g. payment receipt images)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('image/') || contentType.includes('application/octet-stream')) {
      if (!response.ok) {
        throw new ApiError('تعذر تحميل الصورة المطلوبة', response.status);
      }
      return response.blob();
    }

    // Unpack standard JSON envelope
    let json;
    try {
      json = await response.json();
    } catch {
      if (!response.ok) {
        throw new ApiError('حدث خطأ غير متوقع في الخادم', response.status);
      }
      return { success: true, data: null, message: '' };
    }

    if (!response.ok || (json && json.success === false)) {
      const message = json?.message || (response.status >= 500
        ? 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً'
        : 'تعذر إتمام العملية المطلوبة');
      throw new ApiError(message, response.status, json?.errors || null, json?.data || null);
    }

    return json;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network failure / Offline
    throw new ApiError('تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت', 0);
  }
}

// Convenience Methods
export const api = {
  get: (endpoint, options) => apiClient(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) =>
    apiClient(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: (endpoint, body, options) =>
    apiClient(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: (endpoint, options) => apiClient(endpoint, { ...options, method: 'DELETE' }),
};

export { axiosInstance } from './axios';
export { mapApiError } from './errorMapper';
