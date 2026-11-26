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
 * Format ISO 8601 UTC timestamp to readable Arabic date with Western digits in Africa/Khartoum timezone (YYYY/MM/DD)
 */
export function formatDate(isoString) {
  if (!isoString) return '';
  return formatDateSafe(isoString, typeof isoString === 'string' ? isoString : '', false);
}

/**
 * Format ISO 8601 UTC timestamp to readable date and 12-hour time (YYYY/MM/DD H:MM ص/م)
 */
export function formatDateTime(isoString) {
  if (!isoString) return '';
  const dateStr = formatDate(isoString);
  const timeStr = format12hTime(isoString);
  return `${dateStr} ${timeStr}`.trim();
}

/**
 * Format 12-hour time with ص/م in Africa/Khartoum timezone
 */
export function format12hTime(dateOrIso) {
  if (!dateOrIso) return '9:00 ص';
  try {
    const d = dateOrIso instanceof Date ? dateOrIso : new Date(dateOrIso);
    if (isNaN(d.getTime())) return '9:00 ص';
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Khartoum',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const parts = formatter.formatToParts(d);
    const hour = parts.find((p) => p.type === 'hour')?.value || '12';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';
    const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value || 'AM';
    const periodAr = dayPeriod.toUpperCase() === 'PM' ? 'م' : 'ص';
    return `${hour}:${minute} ${periodAr}`;
  } catch {
    return '9:00 ص';
  }
}

/**
 * Format price update caption: "اليوم 9:00 ص" or "أمس 9:00 ص"
 */
export function formatPriceUpdateCaption(isoString) {
  if (!isoString) return `اليوم ${format12hTime(null)}`;
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return `اليوم ${format12hTime(null)}`;

    const now = new Date();
    const dStr = d.toLocaleDateString('en-US', { timeZone: 'Africa/Khartoum' });
    const nowStr = now.toLocaleDateString('en-US', { timeZone: 'Africa/Khartoum' });

    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    const yestStr = yest.toLocaleDateString('en-US', { timeZone: 'Africa/Khartoum' });

    const timeStr = format12hTime(d);
    if (dStr === nowStr) {
      return `اليوم ${timeStr}`;
    }
    if (dStr === yestStr) {
      return `أمس ${timeStr}`;
    }
    return `${d.toLocaleDateString('en-GB', { timeZone: 'Africa/Khartoum' })} ${timeStr}`;
  } catch {
    return `اليوم ${format12hTime(null)}`;
  }
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
      return { label: 'مقبول', variant: 'success' };
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
      return 'مستعمل استيراد';
    default:
      // Unknown or missing condition: say nothing rather than claim one (compatible
      // accessories arrived without a condition and were labelled "used").
      return '';
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
  const resolvedPath = typeof path === 'object' ? (path.image_url || path.url || path.path || '') : path;
  if (!resolvedPath || typeof resolvedPath !== 'string') {
    return '/favicon.svg';
  }
  if (resolvedPath.startsWith('http://') || resolvedPath.startsWith('https://')) {
    return resolvedPath;
  }
  const cleanPath = resolvedPath.startsWith('/') ? resolvedPath : `/${resolvedPath}`;
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
 * Convert Eastern Arabic (٠-٩) and Persian (۰-۹) numerals to standard Western ASCII digits (0-9).
 * Returns empty string for null/undefined, and leaves non-numeric characters untouched.
 */
export function toAsciiDigits(input) {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
}

/**
 * Normalize and clean Sudanese mobile numbers
 * Accepts local (09XXXXXXXX / 01XXXXXXXX), +249… and 249… forms, in Western or Arabic digits
 * Returns the normalized 10-digit local format (09XXXXXXXX)
 */
export function normalizeSudanPhone(input) {
  if (!input) return '';
  const ascii = toAsciiDigits(input);
  let cleaned = ascii.replace(/[^\d+]/g, '');
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
