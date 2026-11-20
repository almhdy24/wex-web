import { describe, it, expect } from 'vitest';
import {
  pluralAr,
  relativeTimeAr,
  errorMapper,
  getErrorMessage,
  safeText,
  formatSdgSafe,
  formatAedSafe,
  formatMoney,
  formatDateSafe,
  formatSdg,
  formatAed,
} from '../utils/index.js';

describe('Modern Standard Arabic Pluralization (pluralAr)', () => {
  const deviceForms = {
    one: 'جهاز',
    two: 'جهازان',
    few: 'أجهزة',
    many: 'جهازًا',
  };

  const minuteForms = {
    one: 'دقيقة',
    two: 'دقيقتان',
    few: 'دقائق',
    many: 'دقيقة',
  };

  it('correctly handles 1 device (singular without numeral)', () => {
    expect(pluralAr(1, deviceForms)).toBe('جهاز');
  });

  it('correctly handles 2 devices (dual without numeral)', () => {
    expect(pluralAr(2, deviceForms)).toBe('جهازان');
  });

  it('correctly handles 3 to 10 devices (plural genitive with numeral)', () => {
    expect(pluralAr(3, deviceForms)).toBe('3 أجهزة');
    expect(pluralAr(5, deviceForms)).toBe('5 أجهزة');
    expect(pluralAr(10, deviceForms)).toBe('10 أجهزة');
  });

  it('correctly handles 11 to 99 devices (singular accusative with numeral)', () => {
    expect(pluralAr(11, deviceForms)).toBe('11 جهازًا');
    expect(pluralAr(25, deviceForms)).toBe('25 جهازًا');
    expect(pluralAr(99, deviceForms)).toBe('99 جهازًا');
  });

  it('correctly handles 100 and multiples (singular genitive with numeral)', () => {
    expect(pluralAr(100, deviceForms)).toBe('100 جهاز');
    expect(pluralAr(200, deviceForms)).toBe('200 جهاز');
  });

  it('correctly handles minute forms per specification', () => {
    expect(pluralAr(1, minuteForms)).toBe('دقيقة');
    expect(pluralAr(2, minuteForms)).toBe('دقيقتان');
    expect(pluralAr(3, minuteForms)).toBe('3 دقائق');
    expect(pluralAr(10, minuteForms)).toBe('10 دقائق');
    expect(pluralAr(11, minuteForms)).toBe('11 دقيقة');
  });

  it('handles 0 with default and custom zero forms', () => {
    expect(pluralAr(0, deviceForms)).toBe('0 أجهزة');
    expect(pluralAr(0, { ...deviceForms, zero: 'لا توجد أجهزة' })).toBe('لا توجد أجهزة');
  });

  it('handles invalid inputs gracefully without throwing', () => {
    expect(pluralAr(NaN, deviceForms)).toBe('جهاز');
    expect(pluralAr(null, deviceForms)).toBe('0 أجهزة');
    expect(pluralAr(undefined, deviceForms)).toBe('جهاز');
  });
});

describe('Arabic Relative Time Formatter (relativeTimeAr)', () => {
  const baseTime = new Date('2026-11-20T14:00:00Z');

  it('returns "الآن" for past differences under 60 seconds', () => {
    const justNow = new Date('2026-11-20T13:59:45Z');
    expect(relativeTimeAr(justNow, baseTime)).toBe('الآن');
  });

  it('returns exact Arabic phrases for minutes', () => {
    const oneMinAgo = new Date('2026-11-20T13:59:00Z');
    expect(relativeTimeAr(oneMinAgo, baseTime)).toBe('قبل دقيقة');

    const twoMinsAgo = new Date('2026-11-20T13:58:00Z');
    expect(relativeTimeAr(twoMinsAgo, baseTime)).toBe('قبل دقيقتين');

    const fiveMinsAgo = new Date('2026-11-20T13:55:00Z');
    expect(relativeTimeAr(fiveMinsAgo, baseTime)).toBe('قبل 5 دقائق');

    const elevenMinsAgo = new Date('2026-11-20T13:49:00Z');
    expect(relativeTimeAr(elevenMinsAgo, baseTime)).toBe('قبل 11 دقيقة');
  });

  it('returns exact Arabic phrases for hours', () => {
    const oneHourAgo = new Date('2026-11-20T13:00:00Z');
    expect(relativeTimeAr(oneHourAgo, baseTime)).toBe('قبل ساعة');

    const twoHoursAgo = new Date('2026-11-20T12:00:00Z');
    expect(relativeTimeAr(twoHoursAgo, baseTime)).toBe('قبل ساعتين');

    const threeHoursAgo = new Date('2026-11-20T11:00:00Z');
    expect(relativeTimeAr(threeHoursAgo, baseTime)).toBe('قبل 3 ساعات');
  });

  it('returns exact Arabic phrases for days', () => {
    const oneDayAgo = new Date('2026-11-19T14:00:00Z');
    expect(relativeTimeAr(oneDayAgo, baseTime)).toBe('قبل يوم');

    const twoDaysAgo = new Date('2026-11-18T14:00:00Z');
    expect(relativeTimeAr(twoDaysAgo, baseTime)).toBe('قبل يومين');

    const fiveDaysAgo = new Date('2026-11-15T14:00:00Z');
    expect(relativeTimeAr(fiveDaysAgo, baseTime)).toBe('قبل 5 أيام');
  });

  it('formats future relative times properly', () => {
    const fiveMinsFuture = new Date('2026-11-20T14:05:00Z');
    expect(relativeTimeAr(fiveMinsFuture, baseTime)).toBe('بعد 5 دقائق');

    const twoHoursFuture = new Date('2026-11-20T16:00:00Z');
    expect(relativeTimeAr(twoHoursFuture, baseTime)).toBe('بعد ساعتين');
  });

  it('formats older dates (>30 days) into Africa/Khartoum date format', () => {
    const oldDate = new Date('2026-09-01T10:00:00Z');
    const result = relativeTimeAr(oldDate, baseTime);
    expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
  });

  it('handles invalid date inputs safely', () => {
    expect(relativeTimeAr(null)).toBe('');
    expect(relativeTimeAr(undefined)).toBe('');
    expect(relativeTimeAr('invalid-date')).toBe('');
  });
});

describe('Safe Text & Formatters (safeFormatters)', () => {
  it('safeText strictly rejects undefined, null, NaN, and [object Object]', () => {
    expect(safeText(undefined)).toBe('');
    expect(safeText(null)).toBe('');
    expect(safeText(NaN)).toBe('');
    expect(safeText({})).toBe('');
    expect(safeText({ foo: 'bar' })).toBe('');
    expect(safeText('[object Object]')).toBe('');
    expect(safeText('undefined')).toBe('');
    expect(safeText('null')).toBe('');
    expect(safeText('NaN')).toBe('');
  });

  it('safeText accepts custom fallback', () => {
    expect(safeText(null, 'غير متوفر')).toBe('غير متوفر');
    expect(safeText(undefined, '—')).toBe('—');
    expect(safeText({}, 'بدون بيانات')).toBe('بدون بيانات');
  });

  it('safeText correctly renders valid strings and numbers', () => {
    expect(safeText('لابتوب ديل')).toBe('لابتوب ديل');
    expect(safeText(1500)).toBe('1500');
    expect(safeText(0)).toBe('0');
    expect(safeText(false)).toBe('false');
  });

  it('formatSdgSafe properly formats thousands with SDG currency and never leaks NaN', () => {
    expect(formatSdgSafe(1250000)).toBe('1,250,000 ج.س');
    expect(formatSdgSafe('487500')).toBe('487,500 ج.س');
    expect(formatSdgSafe(0)).toBe('0 ج.س');
    expect(formatSdgSafe(null)).toBe('0 ج.س');
    expect(formatSdgSafe(undefined)).toBe('0 ج.س');
    expect(formatSdgSafe(NaN)).toBe('0 ج.س');
    expect(formatSdgSafe({})).toBe('0 ج.س');
  });

  it('formatAedSafe properly formats thousands with AED currency and handles edge cases', () => {
    expect(formatAedSafe(1500)).toBe('1,500 د.إ');
    expect(formatAedSafe(null)).toBe('0 د.إ');
    expect(formatAedSafe(undefined)).toBe('0 د.إ');
    expect(formatAedSafe(NaN)).toBe('0 د.إ');
  });

  it('formatMoney supports custom currencies and fallbacks', () => {
    expect(formatMoney(2500, 'دولار')).toBe('2,500 دولار');
    expect(formatMoney(null, 'ريال')).toBe('0 ريال');
    expect(formatMoney(null, 'ج.س', 'مجاناً')).toBe('مجاناً');
  });

  it('formatDateSafe formats in Africa/Khartoum timezone with Western digits', () => {
    const utcDate = '2026-11-20T12:00:00Z'; // 14:00 in Khartoum (UTC+2)
    const formatted = formatDateSafe(utcDate, '', true);
    expect(formatted).toBe('2026/11/20 - 14:00');

    const dateOnly = formatDateSafe(utcDate, '', false);
    expect(dateOnly).toBe('2026/11/20');

    expect(formatDateSafe(null)).toBe('');
    expect(formatDateSafe('invalid')).toBe('');
  });

  it('backward compatibility of formatSdg and formatAed', () => {
    expect(formatSdg(50000)).toBe('50,000 ج.س');
    expect(formatAed(300)).toBe('300 د.إ');
    expect(formatSdg(null)).toBe('0 ج.س');
  });
});

describe('Error Mapper (errorMapper)', () => {
  it('maps HTTP 0 / network failure to friendly Arabic with retry hint', () => {
    const error = errorMapper(0);
    expect(error.status).toBe(0);
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.title).toBe('تعذر الاتصال بالخادم');
    expect(error.message).toContain('اتصالك بالإنترنت');
    expect(error.retryable).toBe(true);
    expect(error.retryHint).toBeTruthy();
  });

  it('maps TypeError fetch failures to status 0 network error', () => {
    const fetchError = new TypeError('Failed to fetch');
    const error = errorMapper(fetchError);
    expect(error.status).toBe(0);
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.retryable).toBe(true);
  });

  it('maps HTTP 400, 401, 403, 404, 409, 413, 422, 429 correctly', () => {
    expect(errorMapper(400).code).toBe('BAD_REQUEST');
    expect(errorMapper(401).code).toBe('UNAUTHORIZED');
    expect(errorMapper(403).code).toBe('FORBIDDEN');
    expect(errorMapper(404).code).toBe('NOT_FOUND');
    expect(errorMapper(409).code).toBe('CONFLICT');
    expect(errorMapper(413).code).toBe('PAYLOAD_TOO_LARGE');
    expect(errorMapper(422).code).toBe('UNPROCESSABLE_ENTITY');

    const rateLimit = errorMapper(429);
    expect(rateLimit.code).toBe('TOO_MANY_REQUESTS');
    expect(rateLimit.retryable).toBe(true);
  });

  it('maps server errors 500, 502, 503, 504 with retryable true', () => {
    const err500 = errorMapper(500);
    expect(err500.code).toBe('INTERNAL_SERVER_ERROR');
    expect(err500.retryable).toBe(true);

    const err503 = errorMapper(503);
    expect(err503.code).toBe('SERVICE_UNAVAILABLE');
    expect(err503.retryable).toBe(true);

    const err504 = errorMapper(504);
    expect(err504.code).toBe('GATEWAY_TIMEOUT');
    expect(err504.retryable).toBe(true);
  });

  it('preserves custom backend message when provided', () => {
    const custom = errorMapper({ status: 400, message: 'رقم الهاتف مستخدم بالفعل' });
    expect(custom.status).toBe(400);
    expect(custom.message).toBe('رقم الهاتف مستخدم بالفعل');
    expect(custom.code).toBe('BAD_REQUEST');
  });

  it('provides getErrorMessage helper and toString support', () => {
    expect(getErrorMessage(404)).toBe('العنصر المطلوب غير موجود أو ربما تم نقله');
    expect(String(errorMapper(404))).toBe('العنصر المطلوب غير موجود أو ربما تم نقله');
  });
});
