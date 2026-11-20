/**
 * Wex Technology Central API Client
 *
 * Implements standard envelope unpacking, JWT refresh token rotation with single-flight
 * deduplication, error normalization with Arabic messages, and multipart FormData handling.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1';

// In-memory access token storage (never stored in localStorage/sessionStorage)
let memoryAccessToken = null;
let refreshPromise = null;
let onAuthFailedCallback = null;

export function setMemoryAccessToken(token) {
  memoryAccessToken = token;
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
 * Executes a token refresh request, sharing the promise across concurrent callers.
 * Web clients use HttpOnly cookie automatically; mobile clients may supply a refresh token.
 */
export async function performTokenRefresh(optionalRefreshToken = null) {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const body = optionalRefreshToken ? { refresh_token: optionalRefreshToken } : {};

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const envelope = await response.json().catch(() => null);

      if (!response.ok || !envelope?.success) {
        throw new Error(envelope?.message || 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً');
      }

      const { access_token } = envelope.data;
      memoryAccessToken = access_token;

      return access_token;
    } catch (err) {
      // Clear invalid memory session
      memoryAccessToken = null;

      // Clean up legacy keys if lingering from old sessions
      try {
        sessionStorage.removeItem('wex_access_token');
        localStorage.removeItem('wex_refresh_token');
      } catch {
        // ignore storage errors
      }

      if (typeof onAuthFailedCallback === 'function') {
        onAuthFailedCallback();
      }
      throw err;
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

  try {
    const response = await fetch(url, {
      ...options,
      credentials: options.credentials || 'include',
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
          credentials: options.credentials || 'include',
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
