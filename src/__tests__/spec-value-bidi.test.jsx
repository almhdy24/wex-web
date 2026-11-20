import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import SpecValue, { normalizeSpecText, formatSpecValue } from '../utils/formatSpecValue';
import LatinText from '../components/common/LatinText';

describe('Phase 4: Spec Values Normalization & Bidi Text Direction', () => {
  it('1. Inserts non-breaking space (\\u00A0) between numbers and technical units', () => {
    expect(normalizeSpecText('8GB')).toBe('8\u00A0GB');
    expect(normalizeSpecText('16 GB RAM')).toBe('16\u00A0GB RAM');
    expect(normalizeSpecText('256GB SSD')).toBe('256\u00A0GB SSD');
    expect(normalizeSpecText('1TB HDD')).toBe('1\u00A0TB HDD');
    expect(normalizeSpecText('2.4GHz')).toBe('2.4\u00A0GHz');
    expect(normalizeSpecText('14" FHD')).toBe('14\u00A0" FHD');
    expect(normalizeSpecText('65W Type-C')).toBe('65\u00A0W Type-C');
    expect(normalizeSpecText('52Wh')).toBe('52\u00A0Wh');
  });

  it('2. Preserves complex technical CPU and GPU strings without distortion', () => {
    const cpu = 'Intel Core i5-8250U @ 1.6GHz';
    expect(normalizeSpecText(cpu)).toBe('Intel Core i5-8250U @ 1.6\u00A0GHz');

    const gpu = 'NVIDIA GeForce GTX 1650 4GB';
    expect(normalizeSpecText(gpu)).toBe('NVIDIA GeForce GTX 1650 4\u00A0GB');
  });

  it('3. SpecValue component wraps formatted content in <bdi dir="ltr">', () => {
    const html = renderToStaticMarkup(<SpecValue value="16GB DDR4" />);
    expect(html).toBe('<bdi dir="ltr">16\u00A0GB DDR4</bdi>');
  });

  it('4. Handles null, undefined, and empty string safely', () => {
    expect(formatSpecValue(null)).toBe('');
    expect(formatSpecValue(undefined)).toBe('');
    expect(formatSpecValue('')).toBe('');

    const htmlNull = renderToStaticMarkup(<SpecValue value={null} />);
    expect(htmlNull).toBe('');
  });

  it('5. LatinText component wraps Latin names in <bdi dir="ltr"> avoiding RTL flip', () => {
    const html = renderToStaticMarkup(<LatinText>ThinkPad X1 Carbon Gen 9</LatinText>);
    expect(html).toBe('<bdi dir="ltr">ThinkPad X1 Carbon Gen 9</bdi>');
  });

  it('6. Arabic-first document title format test', () => {
    const formatDocTitle = (page) => `ويكس تكنولوجي | ${page}`;
    expect(formatDocTitle('الرئيسية')).toBe('ويكس تكنولوجي | الرئيسية');
    expect(formatDocTitle('تفاصيل الجهاز')).toBe('ويكس تكنولوجي | تفاصيل الجهاز');
    expect(formatDocTitle('ThinkPad T480s')).toBe('ويكس تكنولوجي | ThinkPad T480s');
    expect(formatDocTitle('سلة المشتريات')).toBe('ويكس تكنولوجي | سلة المشتريات');
  });
});
