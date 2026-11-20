/**
 * Modern Standard Arabic (الفصحى المعاصرة) Pluralization Utility
 *
 * Arabic grammar rules for counting nouns:
 * - 0: zero form or '0 {few|many|one}'
 * - 1: singular (forms.one) without numeral (e.g. "جهاز", "دقيقة")
 * - 2: dual (forms.two) without numeral (e.g. "جهازان", "دقيقتان")
 * - 3..10 (and compound numbers ending in 3..10): plural genitive (forms.few) with numeral (e.g. "3 أجهزة", "3 دقائق")
 * - 11..99 (and compound numbers ending in 11..99): singular accusative (forms.many) with numeral (e.g. "11 جهازًا", "11 دقيقة")
 * - 100, 200, 1000, 1000000...: singular genitive (forms.one) with numeral (e.g. "100 جهاز")
 */

export function pluralAr(n, forms = {}) {
  const num = Number(n);
  if (isNaN(num)) {
    return forms.one || '';
  }

  const abs = Math.abs(num);

  if (abs === 0) {
    if (forms.zero) {
      return forms.zero;
    }
    return `0 ${forms.few || forms.many || forms.one || ''}`.trim();
  }

  if (abs === 1) {
    return forms.one || '';
  }

  if (abs === 2) {
    return forms.two || `${abs} ${forms.few || forms.one || ''}`.trim();
  }

  const mod100 = abs % 100;

  if (mod100 >= 3 && mod100 <= 10) {
    return `${abs} ${forms.few || forms.one || ''}`.trim();
  }

  if (mod100 >= 11 && mod100 <= 99) {
    return `${abs} ${forms.many || forms.one || ''}`.trim();
  }

  // Multiples of 100, 1000, etc. (100, 200, 300...) or 101, 102 in modern UI
  return `${abs} ${forms.one || forms.many || ''}`.trim();
}

export default pluralAr;
