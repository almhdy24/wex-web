// Pure helpers for the promotions admin: option lists, client validation, time conversion.

export const PLACEMENTS = [
  { value: 'home_hero', label: 'الرئيسية: بنر رئيسي (تطبيق)' },
  { value: 'home_strip', label: 'الرئيسية: شريط إعلان (تطبيق)' },
  { value: 'store_inline', label: 'المتجر: بين المنتجات (تطبيق)' },
  { value: 'cart_promo', label: 'السلة (تطبيق)' },
  { value: 'web_hero', label: 'الموقع: بنر رئيسي' },
  { value: 'web_strip', label: 'الموقع: شريط إعلان' },
  { value: 'web_inline', label: 'الموقع: بين المنتجات' },
];
export const LAYOUTS = [
  { value: 'text', label: 'نص فقط' },
  { value: 'image', label: 'صورة كاملة' },
  { value: 'split', label: 'نص وصورة' },
];
export const THEMES = [
  { value: 'ink', label: 'داكن' },
  { value: 'teal', label: 'أخضر مزرق' },
  { value: 'sun', label: 'ذهبي' },
  { value: 'paper', label: 'فاتح' },
];
export const ACTIONS = [
  { value: 'none', label: 'بدون إجراء' },
  { value: 'product', label: 'فتح منتج' },
  { value: 'category', label: 'فتح فئة' },
  { value: 'filter', label: 'بحث في المتجر' },
  { value: 'url', label: 'رابط خارجي' },
  { value: 'whatsapp', label: 'رسالة واتساب' },
];
export const PLATFORMS = [
  { value: 'all', label: 'الكل' },
  { value: 'app', label: 'التطبيق' },
  { value: 'web', label: 'الموقع' },
];

export const EMPTY_PROMO = {
  placement: 'home_hero', title: '', subtitle: '', badge_text: '', cta_label: '', action_type: 'none', action_value: '',
  layout: 'text', theme: 'ink', image_alt: '', show_countdown: false, platform: 'all', priority: 0, is_active: true,
  starts_at: '', ends_at: '',
};

export const LIMITS = { title: 60, subtitle: 120, badge_text: 24, cta_label: 24 };

/** ISO (UTC) -> value for <input type="datetime-local"> in Africa/Khartoum (UTC+2). */
export function isoToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() + 2 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}

/** datetime-local (Khartoum) -> ISO UTC string, or '' when empty. */
export function localInputToIso(v) {
  if (!v) return '';
  return new Date(`${v}:00+02:00`).toISOString();
}

export function formatKhartoum(iso) {
  if (!iso) return '';
  const k = new Date(new Date(iso).getTime() + 2 * 3600 * 1000);
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const h = k.getUTCHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${k.getUTCDate()} ${months[k.getUTCMonth()]} ${k.getUTCFullYear()} · ${h12}:${String(k.getUTCMinutes()).padStart(2, '0')} ${h < 12 ? 'ص' : 'م'}`;
}

/** Client-side mirror of the server rules (server remains the authority). */
export function validatePromo(f, { hasImage = false } = {}) {
  const e = {};
  const t = (f.title || '').trim();
  if (!t) e.title = 'عنوان العرض مطلوب';
  else if (t.length > LIMITS.title) e.title = `العنوان يجب ألا يزيد عن ${LIMITS.title} حرفاً`;
  if ((f.subtitle || '').length > LIMITS.subtitle) e.subtitle = `الوصف يجب ألا يزيد عن ${LIMITS.subtitle} حرفاً`;
  if ((f.badge_text || '').length > LIMITS.badge_text) e.badge_text = `الشارة يجب ألا تزيد عن ${LIMITS.badge_text} حرفاً`;
  if ((f.cta_label || '').length > LIMITS.cta_label) e.cta_label = `نص الزر يجب ألا يزيد عن ${LIMITS.cta_label} حرفاً`;
  if (f.action_type && f.action_type !== 'none') {
    if (!(f.cta_label || '').trim()) e.cta_label = 'اكتب نص الزر عند اختيار إجراء';
    const v = (f.action_value || '').trim();
    if (!v) e.action_value = 'قيمة الإجراء مطلوبة';
    else if (f.action_type === 'url' && !/^https:\/\/\S+$/i.test(v)) e.action_value = 'أدخل رابطاً صحيحاً يبدأ بـ https://';
  }
  if (f.starts_at && f.ends_at && new Date(localInputToIso(f.ends_at)) <= new Date(localInputToIso(f.starts_at))) {
    e.ends_at = 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية';
  }
  if ((f.layout === 'image' || f.layout === 'split') && !hasImage) e.image = 'هذا الشكل يحتاج صورة';
  return e;
}

export function payloadFrom(f) {
  return {
    ...f,
    priority: Number(f.priority) || 0,
    starts_at: localInputToIso(f.starts_at) || null,
    ends_at: localInputToIso(f.ends_at) || null,
    show_countdown: f.show_countdown ? 1 : 0,
    is_active: f.is_active ? 1 : 0,
  };
}
