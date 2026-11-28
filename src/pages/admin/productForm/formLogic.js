// Pure helpers for the category-driven product form (no React): validation, error mapping,
// completeness, name building and typo guard. The spec schema comes from the API
// (GET /spec-schema) so server and form validate against the same definition.

export const CONDITION_OPTIONS = [
  { value: 'new', label: 'جديد' },
  { value: 'used_imported', label: 'مستعمل مستورد' },
  { value: 'refurbished', label: 'مجدّد' },
];
export const TYPE_VALUES = ['laptop', 'phone', 'accessory'];
export const TYPE_LABELS = { laptop: 'حاسوب', phone: 'هاتف', accessory: 'ملحق' };

// Section order of the stepper; every form field belongs to exactly one section.
export const SECTIONS = [
  { id: 'category', label: 'التصنيف' },
  { id: 'photos', label: 'الصور' },
  { id: 'basic', label: 'المعلومات الأساسية' },
  { id: 'specs', label: 'المواصفات' },
  { id: 'pricing', label: 'السعر والمخزون' },
  { id: 'review', label: 'المراجعة والنشر' },
];

export const FIELD_SECTION = {
  type: 'category', subcategory: 'category', category_id: 'category', brand_id: 'category', condition: 'category',
  name: 'basic', short_description: 'basic', description: 'basic', warranty_text: 'basic',
  price_aed: 'pricing', compare_at_price: 'pricing', stock_quantity: 'pricing',
};
export const sectionOfField = (field) =>
  field.startsWith('spec.') ? 'specs' : FIELD_SECTION[field] || 'basic';

const FIELD_FALLBACK_AR = {
  name: 'اسم الجهاز غير صالح',
  type: 'اختر نوع المنتج',
  subcategory: 'اختر نوع الملحق',
  category_id: 'اختر القسم',
  brand_id: 'الماركة المحددة غير موجودة',
  condition: 'اختر حالة الجهاز',
  price_aed: 'أدخل السعر كرقم صحيح أكبر من صفر',
  stock_quantity: 'الكمية يجب أن تكون رقماً صحيحاً بين 0 و 100000',
};
const GENERIC_FIELD_AR = 'قيمة غير صحيحة';
export const hasArabic = (t) => /[؀-ۿ]/.test(String(t || ''));

/** Fields of a schema that are visible for the current spec values (conditional `when`). */
export function visibleFields(schema, specs, condition) {
  return (schema?.fields || []).filter((f) => {
    if (f.when && !f.when.in.includes(String(specs?.[f.when.field] ?? ''))) return false;
    if (f.when_condition && condition && !f.when_condition.includes(condition)) return false;
    return true;
  });
}

const isEmpty = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

/**
 * Client-side validation. `f` = base form fields, `schema` = the type's spec schema (optional),
 * `f.specs` = spec values. Keys of the result are field names; spec fields are `spec.<key>`.
 * `draft` relaxes everything except obviously malformed values.
 */
export function validateProductForm(f, schema = null, { draft = false } = {}) {
  const e = {};
  const name = String(f.name || '').trim();
  if (!name) e.name = 'اسم الجهاز مطلوب';
  else if (name.length < 3) e.name = 'اسم الجهاز قصير جداً';
  else if (name.length > 191) e.name = 'اسم الجهاز طويل جداً';
  if (!TYPE_VALUES.includes(f.type)) e.type = FIELD_FALLBACK_AR.type;
  if (draft) return e;

  if (f.type === 'accessory' && schema && !f.subcategory) e.subcategory = FIELD_FALLBACK_AR.subcategory;
  if (!f.category_id) e.category_id = FIELD_FALLBACK_AR.category_id;
  if (!CONDITION_OPTIONS.some((o) => o.value === f.condition)) e.condition = FIELD_FALLBACK_AR.condition;

  const price = Number(f.price_aed);
  if (f.price_aed === '' || f.price_aed === null || f.price_aed === undefined || !Number.isFinite(price) || price <= 0) {
    e.price_aed = 'أدخل السعر';
  } else if (!Number.isInteger(price)) {
    e.price_aed = 'السعر يجب أن يكون رقماً صحيحاً بدون كسور';
  } else if (price > 10000000) {
    e.price_aed = 'السعر كبير جداً';
  }
  if (f.compare_at_price !== '' && f.compare_at_price != null && Number(f.compare_at_price) !== 0) {
    const cmp = Number(f.compare_at_price);
    if (!Number.isInteger(cmp) || cmp <= 0) e.compare_at_price = 'السعر قبل الخصم يجب أن يكون رقماً صحيحاً';
    else if (Number.isFinite(price) && cmp <= price) e.compare_at_price = 'السعر قبل الخصم يجب أن يكون أكبر من سعر البيع';
  }
  const stock = Number(f.stock_quantity);
  if (!Number.isInteger(stock) || stock < 0 || stock > 100000) e.stock_quantity = FIELD_FALLBACK_AR.stock_quantity;

  if (schema) {
    const specs = f.specs || {};
    visibleFields(schema, specs, f.condition).forEach((fld) => {
      const v = specs[fld.key];
      if (isEmpty(v)) {
        if (fld.required) e[`spec.${fld.key}`] = 'هذا الحقل مطلوب';
        return;
      }
      if (fld.input === 'number') {
        const n = Number(v);
        if (!Number.isFinite(n) || (fld.min != null && n < fld.min) || (fld.max != null && n > fld.max)) {
          e[`spec.${fld.key}`] = `أدخل رقماً بين ${fld.min ?? 0} و ${fld.max ?? '∞'}`;
        }
      }
    });
  }
  return e;
}

/** Maps an ApiError.errors object to { field: arabicMessage }; `spec_data.x` becomes `spec.x`. */
export function mapServerErrors(errors) {
  const out = {};
  if (!errors || typeof errors !== 'object') return out;
  Object.entries(errors).forEach(([rawField, msg]) => {
    const field = rawField.startsWith('spec_data.') ? `spec.${rawField.slice(10)}` : rawField;
    const text = Array.isArray(msg) ? msg[0] : msg;
    out[field] = hasArabic(text) ? String(text) : FIELD_FALLBACK_AR[field] || GENERIC_FIELD_AR;
  });
  return out;
}

/** First error in DOM (section) order. */
export function firstErrorField(errors) {
  const order = (k) => {
    const idx = SECTIONS.findIndex((s) => s.id === sectionOfField(k));
    return idx === -1 ? 99 : idx;
  };
  return Object.keys(errors)
    .filter((k) => errors[k])
    .sort((a, b) => order(a) - order(b))[0];
}

/** Sections that currently contain errors. */
export function sectionsWithErrors(errors) {
  const set = new Set();
  Object.keys(errors).forEach((k) => errors[k] && set.add(sectionOfField(k)));
  return set;
}

// ---- Name building / typo guard -------------------------------------------------
const BRAND_CASE = {
  hp: 'HP', dell: 'Dell', lenovo: 'Lenovo', asus: 'ASUS', acer: 'Acer', apple: 'Apple', msi: 'MSI',
  samsung: 'Samsung', huawei: 'Huawei', xiaomi: 'Xiaomi', oppo: 'OPPO', realme: 'realme', tecno: 'TECNO',
  infinix: 'Infinix', nokia: 'Nokia', sony: 'Sony', jbl: 'JBL', logitech: 'Logitech', anker: 'Anker',
  microsoft: 'Microsoft', toshiba: 'Toshiba', razer: 'Razer', iphone: 'iPhone', macbook: 'MacBook',
};
const SERIES_CASE = {
  probook: 'ProBook', elitebook: 'EliteBook', zbook: 'ZBook', thinkpad: 'ThinkPad', ideapad: 'IdeaPad',
  latitude: 'Latitude', inspiron: 'Inspiron', vostro: 'Vostro', xps: 'XPS', precision: 'Precision',
  vivobook: 'VivoBook', zenbook: 'ZenBook', aspire: 'Aspire', swift: 'Swift', nitro: 'Nitro',
  macbook: 'MacBook', galaxy: 'Galaxy', pavilion: 'Pavilion', spectre: 'Spectre', envy: 'Envy',
  yoga: 'Yoga', legion: 'Legion', thinkbook: 'ThinkBook', surface: 'Surface', iphone: 'iPhone',
};
const KNOWN_WORDS = [...Object.values(SERIES_CASE), ...Object.values(BRAND_CASE)];

function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 2) return 9;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j += 1) dp[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[m][n];
}

/** "hp probook 440 g7" -> "HP ProBook 440 G7" (Latin words only; Arabic untouched). */
export function properCase(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => {
      const low = w.toLowerCase();
      if (SERIES_CASE[low]) return SERIES_CASE[low];
      if (BRAND_CASE[low]) return BRAND_CASE[low];
      if (/^g\d$/i.test(w)) return w.toUpperCase();          // G7
      if (/^[a-z]*\d[a-z0-9]*$/i.test(w)) return w.toUpperCase(); // 440, T480, X1
      return w;
    })
    .join(' ');
}

export function buildProductName(brandName, model) {
  const b = String(brandName || '').trim();
  const m = String(model || '').trim();
  if (!m) return b ? properCase(b) : '';
  // Don't repeat the brand when the model already starts with it.
  const joined = m.toLowerCase().startsWith(b.toLowerCase()) ? m : `${b} ${m}`;
  return properCase(joined);
}

/** Returns a warning when a Latin word is a near-miss of a known brand/series (e.g. BROPOOK). */
export function typoWarning(name) {
  const words = String(name || '').match(/[A-Za-z]{4,}/g) || [];
  for (const w of words) {
    const low = w.toLowerCase();
    if (SERIES_CASE[low] || BRAND_CASE[low]) continue;
    for (const known of KNOWN_WORDS) {
      if (known.length >= 5 && editDistance(low, known.toLowerCase()) <= 2) {
        return `تنبيه: هل تقصد «${known}» بدل «${w}»؟`;
      }
    }
  }
  return null;
}

/** Warns when the name is (nearly) identical to an existing product's name. */
export function duplicateWarning(name, existingNames, ignoreName = '') {
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, '');
  const n = norm(name);
  if (n.length < 5) return null;
  const hit = (existingNames || []).find((x) => {
    if (norm(x) === norm(ignoreName)) return false;
    const o = norm(x);
    return o === n || (Math.abs(o.length - n.length) <= 2 && editDistance(o, n) <= 1);
  });
  return hit ? `يوجد منتج بنفس الاسم تقريباً: «${hit}». هل هذا نسخة مكررة؟` : null;
}

// ---- Completeness meter --------------------------------------------------------
/** @returns {{percent:number, missing:{label:string, section:string}[]}} */
export function completeness(f, schema, imageCount) {
  const checks = [
    { label: 'صورة واحدة على الأقل', section: 'photos', ok: imageCount > 0, w: 20 },
    { label: 'اسم الجهاز', section: 'basic', ok: String(f.name || '').trim().length >= 3, w: 10 },
    { label: 'الماركة', section: 'category', ok: Boolean(f.brand_id), w: 10 },
    { label: 'السعر', section: 'pricing', ok: Number(f.price_aed) > 0, w: 15 },
    { label: 'وصف مختصر', section: 'basic', ok: String(f.short_description || '').trim().length > 0, w: 10 },
  ];
  const required = visibleFields(schema, f.specs || {}, f.condition).filter((x) => x.required);
  const perSpec = required.length ? 35 / required.length : 0;
  required.forEach((fld) => {
    checks.push({ label: fld.label, section: 'specs', ok: !isEmpty((f.specs || {})[fld.key]), w: perSpec });
  });
  if (!required.length) checks.push({ label: 'المواصفات', section: 'specs', ok: true, w: 35 });
  const total = checks.reduce((s, c) => s + c.w, 0);
  const got = checks.reduce((s, c) => s + (c.ok ? c.w : 0), 0);
  return {
    percent: Math.round((got / total) * 100),
    missing: checks.filter((c) => !c.ok).map(({ label, section }) => ({ label, section })),
  };
}

/** One-line summary shown on a collapsed section. */
export function sectionSummary(id, f, ctx) {
  switch (id) {
    case 'category':
      return [TYPE_LABELS[f.type], ctx.subtypeLabel, ctx.brandName, ctx.conditionLabel].filter(Boolean).join(' · ');
    case 'photos':
      return ctx.imageCount ? `${ctx.imageCount} صور` : 'لم تُضف صور بعد';
    case 'basic':
      return f.name || 'لم يُدخل الاسم بعد';
    case 'specs':
      return ctx.specLine || 'لم تُحدد مواصفات بعد';
    case 'pricing':
      return f.price_aed ? `${Number(f.price_aed).toLocaleString('en-US')} · المخزون ${f.stock_quantity}` : 'لم يُدخل السعر بعد';
    default:
      return `اكتمال البيانات ${ctx.percent}%`;
  }
}

/** Formats digits with thousands separators while typing ("1200" -> "1,200"). */
export function formatThousands(raw) {
  const digits = String(raw ?? '').replace(/[^\d]/g, '');
  return digits ? Number(digits).toLocaleString('en-US') : '';
}
export const digitsOnly = (raw) => {
  // Eastern Arabic digits -> ASCII first.
  const ascii = String(raw ?? '').replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));
  return ascii.replace(/[^\d]/g, '');
};

/** Strips empty spec values before sending. */
export function cleanSpecs(specs, schema, condition) {
  const out = {};
  visibleFields(schema, specs, condition).forEach((fld) => {
    const v = specs?.[fld.key];
    if (!isEmpty(v)) out[fld.key] = v;
  });
  return out;
}

export function specLineFromSchema(schema, specs) {
  // Short readable line for the collapsed summary: option labels in schema order.
  const parts = [];
  (schema?.fields || []).forEach((fld) => {
    const v = specs?.[fld.key];
    if (isEmpty(v) || fld.key === 'model') return;
    const opt = (fld.options || []).find((o) => o.value === String(v));
    parts.push(opt ? opt.label : `${v}${fld.unit ? ` ${fld.unit}` : ''}`);
  });
  return parts.slice(0, 5).join(' · ');
}
