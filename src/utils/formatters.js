const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1';
const HOST_BASE = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

/**
 * Format integer SDG amount with thousand separators
 */
export function formatSdg(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 ج.س';
  }
  return `${Number(amount).toLocaleString('en-US')} ج.س`;
}

/**
 * Format integer AED amount
 */
export function formatAed(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 د.إ';
  }
  return `${Number(amount).toLocaleString('en-US')} د.إ`;
}

/**
 * Format ISO 8601 UTC timestamp to readable Arabic date
 */
export function formatDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('ar-SD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
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
 * Order status label and semantic badge mapping
 */
export function getOrderStatusInfo(status) {
  switch (status) {
    case 'pending_payment':
      return { label: 'بانتظار الدفع', variant: 'warning', icon: '⏳' };
    case 'payment_review':
      return { label: 'مراجعة إشعار الدفع', variant: 'info', icon: '🔍' };
    case 'confirmed':
      return { label: 'تم تأكيد الطلب', variant: 'success', icon: '✓' };
    case 'ready_for_pickup':
      return { label: 'جاهز للاستلام بالمحل', variant: 'info', icon: '🏪' };
    case 'out_for_delivery':
      return { label: 'جاري التوصيل مع المندوب', variant: 'info', icon: '🚚' };
    case 'completed':
      return { label: 'مكتمل ومستلم', variant: 'success', icon: '🎉' };
    case 'cancelled':
      return { label: 'ملغي', variant: 'danger', icon: '✕' };
    case 'expired':
      return { label: 'انتهت فترة الحجز', variant: 'danger', icon: '⏰' };
    default:
      return { label: status || 'غير معروف', variant: 'neutral', icon: '•' };
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
      return { label: 'مقبول ومعتمد', variant: 'success' };
    case 'rejected':
      return { label: 'مرفوض', variant: 'danger' };
    default:
      return { label: status || 'قيد المراجعة', variant: 'neutral' };
  }
}

/**
 * Condition label mapping
 */
export function getConditionLabel(condition) {
  switch (condition) {
    case 'new':
      return 'جديد بالكرتونة';
    case 'used_imported':
      return 'وارد دبي (مستعمل أصلي)';
    default:
      return condition || 'أصلي';
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
      return 'هاتف ذكي';
    case 'accessory':
      return 'إكسسوار';
    default:
      return type || 'منتج';
  }
}

/**
 * Resolve product image URL with fallback SVG placeholder
 */
export function getProductImageUrl(path, thumb = false) {
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
