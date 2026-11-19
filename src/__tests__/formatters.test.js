import { describe, it, expect } from 'vitest';
import { formatSdg, formatAed, getStockStatusInfo, getConditionLabel, getProductImageUrl } from '../utils/formatters';

describe('Formatters & Business Logic Unit Tests', () => {
  it('formats SDG amounts with Sudan currency symbol', () => {
    expect(formatSdg(487500)).toContain('ج.س');
    expect(formatSdg(0)).toBe('0 ج.س');
    expect(formatSdg(null)).toBe('0 ج.س');
  });

  it('formats AED amounts with UAE currency symbol', () => {
    expect(formatAed(750)).toContain('د.إ');
    expect(formatAed(null)).toBe('0 د.إ');
  });

  it('maps stock status keys to semantic Arabic labels and badges', () => {
    expect(getStockStatusInfo('in_stock')).toEqual({ label: 'متوفر', variant: 'success' });
    expect(getStockStatusInfo('low_stock')).toEqual({ label: 'كمية محدودة', variant: 'warning' });
    expect(getStockStatusInfo('out_of_stock')).toEqual({ label: 'نفد من المخزن', variant: 'danger' });
  });

  it('maps condition keys to Arabic labels', () => {
    expect(getConditionLabel('used_imported')).toBe('مستعمل استيراد');
    expect(getConditionLabel('new')).toBe('جديد');
  });

  it('resolves image URLs correctly', () => {
    expect(getProductImageUrl(null)).toBe('/favicon.svg');
    expect(getProductImageUrl('https://example.com/photo.jpg')).toBe('https://example.com/photo.jpg');
    expect(getProductImageUrl('uploads/products/sample.jpg')).toContain('/uploads/products/sample.jpg');
  });
});
