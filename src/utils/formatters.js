const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1';
const HOST_BASE = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

/**
 * Format integer SDG amount with thousand separators in Western digits (0-9)
 */
export function formatSdg(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 ج.س';
  }
  return `${Number(amount).toLocaleString('en-US')} ج.س`;
}

/**
 * Format integer AED amount in Western digits (0-9)
 */
export function formatAed(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 د.إ';
  }
  return `${Number(amount).toLocaleString('en-US')} د.إ`;
}

/**
 * Format ISO 8601 UTC timestamp to readable Arabic date with Western digits
 */
export function formatDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    // Use Western digits format
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} - ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
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
