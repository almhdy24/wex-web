import { describe, it, expect } from 'vitest';
import { formatSdg, formatAed, formatCondition } from '../utils/formatters';

describe('Price and Currency Formatting (Western Digits & Tabular Numerals)', () => {
  it('formats SDG with Western digits and comma separators', () => {
    const formatted = formatSdg(1250000);
    expect(formatted).toContain('1,250,000');
    expect(formatted).toContain('ج.س');
    // Ensure no Eastern Arabic numerals (٠-٩)
    expect(/[٠-٩]/.test(formatted)).toBe(false);
  });

  it('handles string input gracefully in formatSdg', () => {
    const formatted = formatSdg('45000.75');
    expect(formatted).toContain('45,000.75');
    expect(formatted).toContain('ج.س');
  });

  it('formats AED with Western digits and currency suffix', () => {
    const formatted = formatAed(3200);
    expect(formatted).toContain('3,200');
    expect(formatted).toContain('د.إ');
    expect(/[٠-٩]/.test(formatted)).toBe(false);
  });

  it('formats zero or invalid amounts without throwing errors', () => {
    expect(formatSdg(0)).toBe('0 ج.س');
    expect(formatSdg(null)).toBe('0 ج.س');
    expect(formatAed(0)).toBe('0 د.إ');
    expect(formatAed(undefined)).toBe('0 د.إ');
  });

  it('maps condition strings accurately to honest technical labels', () => {
    expect(formatCondition('new')).toBe('جديد');
    expect(formatCondition('brand_new')).toBe('جديد');
    expect(formatCondition('used')).toBe('مستعمل استيراد');
    expect(formatCondition('used_imported')).toBe('مستعمل استيراد');
    expect(formatCondition('refurbished')).toBe('مجدد');
    expect(formatCondition('open_box')).toBe('كرتونة مفتوحة');
    // Ensure forbidden marketing words are not returned
    expect(formatCondition('used')).not.toContain('وارد دبي');
    expect(formatCondition('used')).not.toContain('أصلي');
  });
});
