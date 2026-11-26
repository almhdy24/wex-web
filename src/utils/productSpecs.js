/**
 * Builds the product page spec rows from whatever shape the API returns.
 *
 * `product.specs` arrives as an object. Seeded products use English keys
 * (cpu, ram, power, capacity…); products saved from the admin form use the Arabic
 * labels the admin typed (المعالج، الرام…). Both must render, and every key that is
 * not one of the six standard rows becomes its own row (VIS-01: accessories and every
 * admin-edited product showed an empty specs card).
 */

const STANDARD_ROWS = [
  { key: 'processor', label: 'المعالج', aliases: ['processor', 'cpu', 'المعالج'] },
  { key: 'ram', label: 'الذاكرة العشوائية', aliases: ['ram', 'memory', 'الرام', 'الذاكرة', 'الذاكرة العشوائية'] },
  { key: 'storage', label: 'التخزين', aliases: ['storage', 'التخزين', 'السعة التخزينية'] },
  { key: 'graphics', label: 'كرت الشاشة', aliases: ['gpu', 'graphics', 'كرت الشاشة', 'كرت الشاشه'] },
  { key: 'screen', label: 'الشاشة', aliases: ['screen', 'screen_size', 'display', 'الشاشة', 'الشاشه'] },
  { key: 'battery', label: 'البطارية', aliases: ['battery', 'البطارية', 'البطاريه'] },
];

// Arabic labels for English keys used by seeds/imports outside the standard six.
const EXTRA_LABELS = {
  power: 'القدرة',
  output: 'الخرج',
  capacity: 'السعة',
  material: 'الخامة',
  speed: 'السرعة',
  interface: 'المنفذ',
  connectivity: 'الاتصال',
  ports: 'المنافذ',
  weight: 'الوزن',
  color: 'اللون',
  os: 'نظام التشغيل',
  range: 'المدى',
  compatibility: 'التوافق',
  dpi: 'دقة المستشعر',
  resolution: 'الدقة',
  refresh_rate: 'معدل التحديث',
  size: 'الحجم',
  type: 'النوع',
};

const norm = (k) => String(k || '').trim().toLowerCase();

function toEntries(specs) {
  if (Array.isArray(specs)) {
    return specs.map((s) => ({
      key: s?.spec_key || s?.name || s?.spec_name || s?.label || '',
      label: s?.spec_name || s?.name || s?.label || '',
      value: s?.spec_value ?? s?.value ?? '',
    }));
  }
  if (specs && typeof specs === 'object') {
    return Object.entries(specs).map(([k, v]) => ({ key: k, label: k, value: v }));
  }
  if (typeof specs === 'string' && specs.trim().startsWith('{')) {
    try {
      return toEntries(JSON.parse(specs));
    } catch {
      return [];
    }
  }
  return [];
}

const clean = (v) => (v === null || v === undefined ? '' : String(v).trim());

export function buildSpecRows(product) {
  if (!product) return [];
  const entries = toEntries(product.specs).filter((e) => clean(e.value) && norm(e.key || e.label));
  const used = new Set();
  // A 'warranty' spec key was never shown: guarantees are not claimed from free-form spec data.
  entries.forEach((e, i) => {
    if (norm(e.key) === 'warranty') used.add(i);
  });

  const rows = STANDARD_ROWS.map((row) => {
    const top = row.aliases.map((a) => clean(product[a])).find(Boolean);
    let value = top || '';
    if (!value) {
      const hit = entries.find((e, i) => !used.has(i) && row.aliases.includes(norm(e.key)));
      if (hit) {
        used.add(entries.indexOf(hit));
        value = clean(hit.value);
      }
    }
    // A spec entry that duplicates a top-level field must not render twice.
    entries.forEach((e, i) => {
      if (row.aliases.includes(norm(e.key))) used.add(i);
    });
    return { key: row.key, label: row.label, value: value || null };
  });

  if (clean(product.warranty_text)) {
    rows.push({ key: 'warranty', label: 'الاستلام والتسليم', value: clean(product.warranty_text) });
  }

  const extraKeys = new Set();
  entries.forEach((e, i) => {
    if (used.has(i)) return;
    const k = norm(e.key);
    if (extraKeys.has(k)) return;
    extraKeys.add(k);
    const label = EXTRA_LABELS[k] || clean(e.label) || clean(e.key);
    rows.push({ key: k, label, value: clean(e.value) });
  });

  return rows;
}
