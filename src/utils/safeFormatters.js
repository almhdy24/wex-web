/**
 * Wex Technology Safe Formatters
 *
 * Guarantees zero rendering of `undefined`, `null`, `NaN`, or `[object Object]`.
 * Formats currencies with thousands separators and proper currency symbols in Western digits (0-9).
 * Formats dates in Africa/Khartoum timezone.
 */

/**
 * Sanitizes any value into safe text, strictly guarding against:
 * `undefined`, `null`, `NaN`, and `[object Object]` leaks.
 *
 * @param {any} value - The input value to sanitize
 * @param {string} fallback - The fallback string (defaults to '')
 * @returns {string} Safe display string
 */
export function safeText(value, fallback = '') {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
      return fallback;
    }
    return String(value);
  }
  if (typeof value === 'object') {
    // Objects/arrays must NEVER serialize into [object Object] in UI text
    return fallback;
  }
  const str = String(value);
  const trimmed = str.trim();
  if (
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed === 'NaN' ||
    trimmed === '[object Object]'
  ) {
    return fallback;
  }
  return str;
}

/**
 * Format integer or float SDG amount with thousand separators in Western digits (0-9)
 * Always appends " ج.س"
 *
 * @param {number|string} amount
 * @param {string} fallback
 * @returns {string} e.g. "1,250,000 ج.س"
 */
export function formatSdgSafe(amount, fallback = '0 ج.س') {
  if (amount === undefined || amount === null || amount === '') {
    return fallback;
  }
  const num = Number(amount);
  if (isNaN(num) || !isFinite(num)) {
    return fallback;
  }
  return `${num.toLocaleString('en-US')} ج.س`;
}

/**
 * Format AED amount with thousand separators in Western digits (0-9)
 * Used strictly in staff/admin contexts.
 *
 * @param {number|string} amount
 * @param {string} fallback
 * @returns {string} e.g. "1,500 د.إ"
 */
export function formatAedSafe(amount, fallback = '0 د.إ') {
  if (amount === undefined || amount === null || amount === '') {
    return fallback;
  }
  const num = Number(amount);
  if (isNaN(num) || !isFinite(num)) {
    return fallback;
  }
  return `${num.toLocaleString('en-US')} د.إ`;
}

/**
 * Generic money formatter with currency unit and thousands separators
 *
 * @param {number|string} amount
 * @param {string} currency - default 'ج.س'
 * @param {string} fallback - default '0 {currency}'
 */
export function formatMoney(amount, currency = 'ج.س', fallback = null) {
  const defaultFallback = `0 ${currency}`;
  const effectiveFallback = fallback !== null ? fallback : defaultFallback;

  if (amount === undefined || amount === null || amount === '') {
    return effectiveFallback;
  }
  const num = Number(amount);
  if (isNaN(num) || !isFinite(num)) {
    return effectiveFallback;
  }
  return `${num.toLocaleString('en-US')} ${currency}`;
}

/**
 * Format ISO 8601 UTC timestamp to readable Arabic date in Africa/Khartoum timezone
 *
 * @param {string|number|Date} isoString
 * @param {string} fallback
 * @param {boolean} includeTime
 * @returns {string} e.g. "2026/11/20 - 14:00"
 */
export function formatDateSafe(isoString, fallback = '', includeTime = true) {
  if (!isoString) return fallback;
  try {
    const d = isoString instanceof Date ? isoString : new Date(isoString);
    if (isNaN(d.getTime())) return fallback;

    const options = {
      timeZone: 'Africa/Khartoum',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = false;
    }

    const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(d);
    const map = {};
    for (const p of parts) {
      map[p.type] = p.value;
    }

    if (includeTime) {
      return `${map.year}/${map.month}/${map.day} - ${map.hour}:${map.minute}`;
    }
    return `${map.year}/${map.month}/${map.day}`;
  } catch {
    return fallback;
  }
}
