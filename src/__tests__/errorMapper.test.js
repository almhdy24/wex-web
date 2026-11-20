import { describe, it, expect } from 'vitest';
import { mapApiError } from '../api/errorMapper';

describe('Shared Arabic Api Error Mapper', () => {
  it('maps HTTP 401 to Arabic session expired message', () => {
    expect(mapApiError({ status: 401 })).toBe('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً');
  });

  it('maps HTTP 403 to Arabic forbidden message', () => {
    expect(mapApiError({ status: 403 })).toBe('لا تملك صلاحية الوصول إلى هذا الطلب');
  });

  it('maps HTTP 409 to Arabic lock expired message', () => {
    expect(mapApiError({ status: 409 })).toBe('انتهت مهلة تثبيت السعر لهذا الطلب');
  });

  it('maps HTTP 413 to Arabic file too large message', () => {
    expect(mapApiError({ status: 413 })).toBe('حجم الملف أكبر من المسموح، صغّر الصورة وحاول مرة أخرى');
  });

  it('maps HTTP 422 to Arabic validation message', () => {
    expect(mapApiError({ status: 422 })).toBe('الملف المرفق ليس صورة صالحة، يرجى رفع صورة بصيغة JPG أو PNG أو WebP');
  });

  it('maps HTTP 429 to Arabic rate limit exceeded message', () => {
    expect(mapApiError({ status: 429 })).toBe('تجاوزت الحد المسموح من المحاولات');
  });

  it('maps network error (status 0) to Arabic connection error message', () => {
    expect(mapApiError({ status: 0 })).toBe('تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت');
  });

  it('preserves existing server Arabic error messages', () => {
    const customArabic = 'تم رفض العملية لعدم مطابقة الحساب البنكي';
    expect(mapApiError({ status: 400, message: customArabic })).toBe(customArabic);
  });
});
