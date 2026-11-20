/**
 * Shared Arabic error mapper for Wex Technology API errors.
 * Normalizes HTTP status codes and error payloads into user-friendly Arabic copy,
 * ensuring no raw English network errors or unhandled status traces are exposed to users.
 */

export function mapApiError(error, defaultMessage = 'تعذر إتمام العملية المطلوبة') {
  if (!error) {
    return defaultMessage;
  }

  // If already string
  if (typeof error === 'string') {
    return error;
  }

  const status = error.status ?? error.response?.status;
  const serverMsg = error.response?.data?.message || error.message;

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
