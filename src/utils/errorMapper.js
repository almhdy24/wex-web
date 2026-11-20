/**
 * Wex Technology HTTP & Network Error Mapper
 * Maps status codes, exceptions, and network failures to friendly Arabic messages with retry hints.
 */

const ERROR_DEFINITIONS = {
  0: {
    code: 'NETWORK_ERROR',
    title: 'تعذر الاتصال بالخادم',
    message: 'تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت',
    retryable: true,
    retryHint: 'تحقق من اتصال الإنترنت وحاول ثانية',
  },
  400: {
    code: 'BAD_REQUEST',
    title: 'طلب غير صالح',
    message: 'البيانات المرسلة غير صحيحة، يرجى مراجعة المدخلات',
    retryable: false,
    retryHint: 'تأكد من صحة البيانات وحاول مجدداً',
  },
  401: {
    code: 'UNAUTHORIZED',
    title: 'انتهت صلاحية الجلسة',
    message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً',
    retryable: false,
    retryHint: 'سجل الدخول للمتابعة',
  },
  403: {
    code: 'FORBIDDEN',
    title: 'غير مصرح بالوصول',
    message: 'ليس لديك صلاحية للوصول إلى هذه الصفحة أو تنفيذ هذا الإجراء',
    retryable: false,
    retryHint: 'تواصل مع إدارة المتجر إذا كنت تعتقد أن هذا خطأ',
  },
  404: {
    code: 'NOT_FOUND',
    title: 'العنصر غير موجود',
    message: 'العنصر المطلوب غير موجود أو ربما تم نقله',
    retryable: false,
    retryHint: 'تأكد من الرابط أو عد إلى الصفحة السابقة',
  },
  408: {
    code: 'REQUEST_TIMEOUT',
    title: 'انتهت مهلة الطلب',
    message: 'استغرق الطلب وقتاً أطول من المتوقع للوصول إلى الخادم',
    retryable: true,
    retryHint: 'أعد المحاولة بعد قليل',
  },
  409: {
    code: 'CONFLICT',
    title: 'تعارض في البيانات',
    message: 'تعارضت العملية مع بيانات مسجلة مسبقاً',
    retryable: false,
    retryHint: 'حدث الصفحة أو راجع البيانات ثم حاول ثانية',
  },
  413: {
    code: 'PAYLOAD_TOO_LARGE',
    title: 'حجم الملف كبير جداً',
    message: 'حجم الملف المرفوع يتجاوز الحد المسموح به',
    retryable: false,
    retryHint: 'اختر صورة أو ملفاً بحجم أصغر (أقل من 800 كيلوبايت)',
  },
  422: {
    code: 'UNPROCESSABLE_ENTITY',
    title: 'خطأ في التحقق من البيانات',
    message: 'يرجى مراجعة الحقول المطلوبة والتأكد من صحة المدخلات',
    retryable: false,
    retryHint: 'أكمل جميع الحقول المطلوبة بشكل صحيح',
  },
  429: {
    code: 'TOO_MANY_REQUESTS',
    title: 'طلبات كثيرة جداً',
    message: 'تم إرسال عدد كبير من الطلبات خلال فترة قصيرة',
    retryable: true,
    retryHint: 'يرجى الانتظار دقيقة واحدة قبل المحاولة مرة أخرى',
  },
  500: {
    code: 'INTERNAL_SERVER_ERROR',
    title: 'خطأ داخلي في الخادم',
    message: 'حدث خطأ في الخادم أثناء معالجة الطلب، نعمل على معالجته',
    retryable: true,
    retryHint: 'يرجى الانتظار والمحاولة بعد قليل',
  },
  502: {
    code: 'BAD_GATEWAY',
    title: 'بوابة غير متوفرة',
    message: 'الخادم غير قادر على الاستجابة مؤقتاً',
    retryable: true,
    retryHint: 'يرجى إعادة المحاولة بعد لحظات',
  },
  503: {
    code: 'SERVICE_UNAVAILABLE',
    title: 'الخدمة غير متوفرة',
    message: 'الخدمة متوقفة مؤقتاً لأعمال الصيانة والتحديث',
    retryable: true,
    retryHint: 'يرجى المحاولة بعد قليل',
  },
  504: {
    code: 'GATEWAY_TIMEOUT',
    title: 'انتهت مهلة استجابة الخادم',
    message: 'استغرق الخادم وقتاً أطول من المعتاد للاستجابة',
    retryable: true,
    retryHint: 'تحقق من اتصالك وحاول مرة أخرى',
  },
};

const DEFAULT_ERROR = {
  code: 'UNKNOWN_ERROR',
  title: 'حدث خطأ غير متوقع',
  message: 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً',
  retryable: true,
  retryHint: 'أعد المحاولة لاحقاً أو تواصل مع الدعم الفني',
};

/**
 * Extract status code from various error input types
 */
function extractStatusCode(input) {
  if (typeof input === 'number') {
    return input;
  }
  if (!input) {
    return null;
  }
  if (typeof input.status === 'number') {
    return input.status;
  }
  if (typeof input.statusCode === 'number') {
    return input.statusCode;
  }
  if (typeof input.response?.status === 'number') {
    return input.response.status;
  }
  if (input.name === 'TypeError' && String(input.message).toLowerCase().includes('fetch')) {
    return 0; // Network fetch error
  }
  return null;
}

/**
 * Maps an error or HTTP status code to structured Arabic messaging
 * @param {number|Error|object|string} error
 * @returns {{ status: number, code: string, title: string, message: string, retryable: boolean, retryHint: string, toString: () => string }}
 */
export function errorMapper(error) {
  const status = extractStatusCode(error);
  const matched = status !== null && ERROR_DEFINITIONS[status] ? ERROR_DEFINITIONS[status] : null;

  // Custom message override if provided by backend or ApiError
  const customMessage = error && typeof error === 'object' && typeof error.message === 'string' && error.message.trim() && !error.message.startsWith('HTTP ') && !error.message.includes('fetch')
    ? error.message
    : null;

  const result = {
    status: status !== null ? status : (error && typeof error === 'object' && error.status) || 500,
    code: matched ? matched.code : DEFAULT_ERROR.code,
    title: matched ? matched.title : DEFAULT_ERROR.title,
    message: customMessage || (matched ? matched.message : DEFAULT_ERROR.message),
    retryable: matched ? matched.retryable : DEFAULT_ERROR.retryable,
    retryHint: matched ? matched.retryHint : DEFAULT_ERROR.retryHint,
    toString() {
      return this.message;
    },
  };

  return result;
}

/**
 * Convenience helper returning just the friendly Arabic message string
 */
export function getErrorMessage(error) {
  return errorMapper(error).message;
}

export default errorMapper;
