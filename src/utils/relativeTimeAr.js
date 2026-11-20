/**
 * Modern Standard Arabic Relative Time Formatter
 * Africa/Khartoum Timezone (UTC+2)
 *
 * Examples:
 * - "الآن"
 * - "قبل دقيقة"، "قبل دقيقتين"، "قبل 5 دقائق"، "قبل 11 دقيقة"
 * - "قبل ساعة"، "قبل ساعتين"، "قبل 3 ساعات"، "قبل 15 ساعة"
 * - "قبل يوم"، "قبل يومين"، "قبل 5 أيام"، "قبل 12 يومًا"
 */

import { pluralAr } from './pluralAr.js';

export function relativeTimeAr(dateInput, baseDate = new Date()) {
  if (!dateInput) return '';

  const target = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(target.getTime())) return '';

  const base = baseDate instanceof Date ? baseDate : new Date(baseDate);
  if (isNaN(base.getTime())) return '';

  const diffMs = base.getTime() - target.getTime();
  const isPast = diffMs >= 0;
  const absMs = Math.abs(diffMs);
  const diffSec = Math.floor(absMs / 1000);

  // Less than 60 seconds
  if (diffSec < 60) {
    return isPast ? 'الآن' : 'بعد لحظات';
  }

  const minutes = Math.floor(diffSec / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Minutes (< 60m)
  if (minutes < 60) {
    if (minutes === 1) return isPast ? 'قبل دقيقة' : 'بعد دقيقة';
    if (minutes === 2) return isPast ? 'قبل دقيقتين' : 'بعد دقيقتين';
    const text = pluralAr(minutes, {
      few: 'دقائق',
      many: 'دقيقة',
      one: 'دقيقة',
    });
    return isPast ? `قبل ${text}` : `بعد ${text}`;
  }

  // Hours (< 24h)
  if (hours < 24) {
    if (hours === 1) return isPast ? 'قبل ساعة' : 'بعد ساعة';
    if (hours === 2) return isPast ? 'قبل ساعتين' : 'بعد ساعتين';
    const text = pluralAr(hours, {
      few: 'ساعات',
      many: 'ساعة',
      one: 'ساعة',
    });
    return isPast ? `قبل ${text}` : `بعد ${text}`;
  }

  // Days (< 30d)
  if (days < 30) {
    if (days === 1) return isPast ? 'قبل يوم' : 'بعد يوم';
    if (days === 2) return isPast ? 'قبل يومين' : 'بعد يومين';
    const text = pluralAr(days, {
      few: 'أيام',
      many: 'يومًا',
      one: 'يوم',
    });
    return isPast ? `قبل ${text}` : `بعد ${text}`;
  }

  // Older than 30 days: format in Africa/Khartoum timezone
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Khartoum',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const formatted = formatter.format(target); // YYYY-MM-DD
    return formatted.replace(/-/g, '/');
  } catch {
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }
}

export default relativeTimeAr;
