/**
 * Shared Arabic error mapper for Wex Technology API errors.
 * Normalizes HTTP status codes and error payloads into user-friendly Arabic copy,
 * ensuring no raw English network errors or unhandled status traces are exposed to users.
 */

export function mapApiError(error, defaultMessage = 'تعذر إتمام العملية المطلوبة') {
  if (!error) {
    return defaultMessage;
  }

  // Non-ApiError (native TypeError, ReferenceError, etc.)
  const isApiError = Boolean(
    error.name === 'ApiError' ||
    error.isApiError === true ||
    typeof error.status === 'number' ||
    typeof error.statusCode === 'number' ||
    typeof error.response?.status === 'number'
  );

  if (error instanceof Error && !isApiError) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('[mapApiError] Non-ApiError caught:', error);
    }
    return 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً';
  }

  // If already string
  if (typeof error === 'string') {
    if (/is not a function|undefined|null|NaN|\[object|Failed to fetch|Network Error/i.test(error)) {
      return defaultMessage;
    }
    return error;
  }

  const status = error.status ?? error.response?.status;
  const serverMsg = error.response?.data?.message || error.message;

  // Filter raw JS text
  if (serverMsg && /is not a function|undefined|null|NaN|\[object|Failed to fetch|Network Error/i.test(serverMsg)) {
    return defaultMessage;
  }

  // If server returned an Arabic message, prioritize it
  if (serverMsg && /[\u0600-\u06FF]/.test(serverMsg)) {
    return serverMsg;
  }

  // Map by HTTP status code
  switch (status) {
    case 401:
      return 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً';
    case 403:
      return 'لا تملك صلاحية الوصول إلى هذا الطلب';
    case 404:
      return 'العنصر المطلوب غير موجود';
    case 409:
      return 'انتهت مهلة تثبيت السعر لهذا الطلب';
    case 413:
      return 'حجم الملف أكبر من المسموح، صغّر الصورة وحاول مرة أخرى';
    case 422:
      return 'الملف المرفق ليس صورة صالحة، يرجى رفع صورة بصيغة JPG أو PNG أو WebP';
    case 429:
      return 'تجاوزت الحد المسموح من المحاولات';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً';
    case 0:
      return 'تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت';
    default:
      return defaultMessage;
  }
}
