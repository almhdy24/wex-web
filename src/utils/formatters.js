import { pluralAr } from './pluralAr.js';
import { relativeTimeAr } from './relativeTimeAr.js';
import { errorMapper, getErrorMessage } from './errorMapper.js';
import {
  safeText,
  formatSdgSafe,
  formatAedSafe,
  formatMoney,
  formatDateSafe,
} from './safeFormatters.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1';
const HOST_BASE = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

// Re-export core utilities
export {
  pluralAr,
  relativeTimeAr,
  errorMapper,
  getErrorMessage,
  safeText,
  formatSdgSafe,
  formatAedSafe,
  formatMoney,
  formatDateSafe,
};

/**
 * Format integer SDG amount with thousand separators in Western digits (0-9)
 */
export function formatSdg(amount) {
  return formatSdgSafe(amount, '0 ج.س');
}

/**
 * Format integer AED amount in Western digits (0-9)
 */
export function formatAed(amount) {
  return formatAedSafe(amount, '0 د.إ');
}

/**
 * Format ISO 8601 UTC timestamp to readable Arabic date with Western digits in Africa/Khartoum timezone
 */
export function formatDate(isoString) {
  if (!isoString) return '';
  return formatDateSafe(isoString, typeof isoString === 'string' ? isoString : '', true);
}

/**
 * Format timestamp to relative human-readable Arabic time in Africa/Khartoum timezone
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const result = relativeTimeAr(isoString);
  return result || formatDate(isoString);
}

/**
 * Stock status pill mapping
 */
export function getStockStatusInfo(status) {
  switch (status) {
    case 'in_stock':
      return { label: 'متوفر', variant: 'success' };
    case 'low_stock':
      return { label: 'كمية محدودة', variant: 'warning' };
    case 'out_of_stock':
      return { label: 'نفد من المخزن', variant: 'danger' };
    default:
      return { label: 'غير محدد', variant: 'neutral' };
  }
}

/**
 * Order status label and semantic badge mapping (NO emojis)
 */
export function getOrderStatusInfo(status) {
  switch (status) {
    case 'pending_payment':
      return { label: 'بانتظار الدفع', variant: 'warning' };
    case 'payment_review':
      return { label: 'مراجعة إشعار الدفع', variant: 'info' };
    case 'confirmed':
      return { label: 'تم تأكيد الطلب', variant: 'success' };
    case 'ready_for_pickup':
      return { label: 'جاهز للاستلام بالمحل', variant: 'info' };
    case 'out_for_delivery':
      return { label: 'جاري التوصيل مع المندوب', variant: 'info' };
    case 'completed':
      return { label: 'مكتمل ومستلم', variant: 'success' };
    case 'cancelled':
      return { label: 'ملغي', variant: 'danger' };
    case 'expired':
      return { label: 'انتهت فترة الحجز', variant: 'danger' };
    default:
      return { label: status || 'غير معروف', variant: 'neutral' };
  }
}

/**
 * Payment proof status mapping
 */
export function getProofStatusInfo(status) {
  switch (status) {
    case 'pending':
      return { label: 'قيد المراجعة', variant: 'warning' };
    case 'approved':
      return { label: 'معتمد', variant: 'success' };
    case 'rejected':
      return { label: 'مرفوض', variant: 'danger' };
    default:
      return { label: status || 'قيد المراجعة', variant: 'neutral' };
  }
}

/**
 * Condition label mapping - Honest Sudanese Arabic terms
 */
export function getConditionLabel(condition) {
  switch (condition) {
    case 'brand_new':
    case 'new':
      return 'جديد';
    case 'open_box':
      return 'كرتونة مفتوحة';
    case 'refurbished':
      return 'مجدد';
    case 'used_imported':
    case 'used':
    default:
      return 'مستعمل استيراد';
  }
}

/**
 * Product type label mapping
 */
export function getProductTypeLabel(type) {
  switch (type) {
    case 'laptop':
      return 'لابتوب';
    case 'phone':
      return 'هاتف';
    case 'accessory':
      return 'ملحق';
    default:
      return type || 'جهاز';
  }
}

/**
 * Resolve product image URL with fallback SVG placeholder
 */
export function getProductImageUrl(path, _thumb = false) {
  if (!path) {
    return '/favicon.svg';
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${HOST_BASE}${cleanPath}`;
}

export const resolveImageUrl = getProductImageUrl;
export const formatCondition = getConditionLabel;

/**
 * Calculate time left until target ISO date
 */
export function calculateTimeLeft(targetDate) {
  if (!targetDate) return { totalMs: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) {
    return { totalMs: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { totalMs: diff, hours, minutes, seconds, expired: false };
}

/**
 * Format remaining time components into tabular hh:mm:ss
 */
export function formatCountdown(hours, minutes, seconds, expired = false) {
  if (expired) return '00:00:00';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Normalize and clean Sudanese mobile numbers
 * Accepts: 0912345678, +249912345678, 249912345678, 0123456789
 * Returns normalized 10-digit format (e.g. 0912345678)
 */
export function normalizeSudanPhone(input) {
  if (!input) return '';
  let cleaned = String(input).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+249')) {
    cleaned = '0' + cleaned.substring(4);
  } else if (cleaned.startsWith('249')) {
    cleaned = '0' + cleaned.substring(3);
  } else if (cleaned.length === 9 && (cleaned.startsWith('9') || cleaned.startsWith('1'))) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

/**
 * Validate Sudanese mobile number
 * Valid formats start with 09 or 01, exactly 10 digits
 */
export function isValidSudanPhone(phone) {
  const normalized = normalizeSudanPhone(phone);
  return /^(09\d{8}|01\d{8})$/.test(normalized);
}
