import React from 'react';

/**
 * Regex matching numbers followed by common technical units
 * (e.g. 8GB -> 8\u00A0GB, 2.4GHz -> 2.4\u00A0GHz, 14" -> 14\u00A0")
 */
const UNIT_REGEX = /(\d+(?:\.\d+)?)\s*(GB|TB|MB|KB|GHz|MHz|Hz|Wh|W|mAh|V|mm|cm|kg|g|["'”’])/gi;

/**
 * Normalizes spec value strings by adding non-breaking spaces (\u00A0)
 * between numbers and units so they never wrap or separate awkwardly.
 */
export function normalizeSpecText(val) {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (!str) return '';
  return str.replace(UNIT_REGEX, '$1\u00A0$2');
}

export function formatSpecValue(val) {
  return normalizeSpecText(val);
}

/**
 * React Component helper that normalizes the spec text and wraps it
 * in <bdi dir="ltr"> to guarantee that English technical spec values
 * (e.g. "8 GB RAM", "Intel Core i5-8250U", "256 GB NVMe SSD")
 * render strictly Left-to-Right without punctuation or parenthesis flipping in RTL.
 */
export default function SpecValue({ value, className }) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const formatted = normalizeSpecText(value);
  // Latin-only values stay strictly LTR. A value containing Arabic ("لأجهزة حتى 15.6 بوصة",
  // or anything an admin typed in Arabic) forced to LTR displays its words out of order;
  // dir="auto" takes the direction of the first strong character instead.
  const dir = /[\u0600-\u06FF]/.test(formatted) ? 'auto' : 'ltr';
  return React.createElement(
    'bdi',
    {
      dir,
      ...(className ? { className } : {}),
    },
    formatted
  );
}
