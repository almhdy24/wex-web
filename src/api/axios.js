import axios from 'axios';
import { getMemoryAccessToken, performTokenRefresh } from './client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

/**
 * Pre-configured Axios instance for cross-origin API communication with credentials.
 * Ensures HttpOnly cookies (such as wex_refresh_token) are automatically transmitted
 * across origins between Android browsers and the CodeIgniter API.
 */
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial: enables sending and receiving cookies cross-origin
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach in-memory access token (never read from localStorage/sessionStorage)
axiosInstance.interceptors.request.use((config) => {
  const token = getMemoryAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // When uploading FormData, remove Content-Type header so Axios/browser sets multipart boundary correctly
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers['Content-Type'];
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
      }
    }
  }

  return config;
});

// Response interceptor: handle 401 with single-flight token refresh and retry
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes('/auth/refresh') &&
      !originalRequest?.url?.includes('/auth/email/verify')
    ) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await performTokenRefresh();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
