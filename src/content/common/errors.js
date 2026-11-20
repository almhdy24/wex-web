/**
 * Common Error States and Validation Messages (الفصحى المعاصرة)
 * Zero emojis, zero marketing puffery.
 */

export const errors = {
  genericTitle: 'حدث خطأ غير متوقع',
  genericDesc: 'حدث خطأ أثناء معالجة طلبك، يرجى المحاولة مرة أخرى.',
  networkTitle: 'تعذر الاتصال بالخادم',
  networkDesc: 'يرجى التحقق من اتصالك بالإنترنت ثم إعادة المحاولة.',
  notFoundTitle: 'الصفحة غير موجودة',
  notFoundDesc: 'الصفحة أو العنصر المطلوب غير متوفر حالياً.',
  forbiddenTitle: 'غير مصرح بالوصول',
  forbiddenDesc: 'ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة أو تنفيذ الإجراء.',
  unauthorizedTitle: 'انتهت صلاحية الجلسة',
  unauthorizedDesc: 'انتهت صلاحية الجلسة الحالية، يرجى تسجيل الدخول مجدداً.',
  serverErrorTitle: 'خطأ في الخادم',
  serverErrorDesc: 'الخدمة غير متوفرة حالياً، نعمل على معالجة المشكلة.',
  payloadTooLargeTitle: 'حجم الملف كبير',
  payloadTooLargeDesc: 'حجم الملف المرفوع يتجاوز الحد المسموح به (الحد الأقصى 5 ميجابايت).',
  requiredField: 'هذا الحقل مطلوب',
  invalidEmail: 'يرجى إدخال بريد إلكتروني صالح',
  invalidSudanPhone: 'يرجى إدخال رقم هاتف سوداني صحيح (يبدأ بـ 09 أو 01 ويتكون من 10 أرقام)',
  invalidAmount: 'يرجى إدخال مبلغ صالح',
  invalidOtp: 'رمز التحقق يجب أن يتكون من 6 أرقام',
  minItemsRequired: 'يجب اختيار عنصر واحد على الأقل',
  outOfStock: 'نفد من المخزن',
  priceLockExpired: 'انتهت فترة حجز السعر المحددة',
};

export default errors;
