// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import OrderNumber, { formatOrderNumber } from '../components/common/OrderNumber';
import OrderDate, { formatOrderDateLine } from '../components/common/OrderDate';

describe('OrderNumber Component & Formatter', () => {
  it('formats order number for plain text with and without hash', () => {
    expect(formatOrderNumber('WEX-12345')).toBe('#WEX-12345');
    expect(formatOrderNumber('#WEX-12345')).toBe('#WEX-12345');
    expect(formatOrderNumber('WEX-12345', false)).toBe('WEX-12345');
    expect(formatOrderNumber('')).toBe('');
  });

  it('renders "#CODE" as one isolated LTR unit after the Arabic prefix', () => {
    // Current contract (OrderNumber.jsx): the hash travels inside the <bdi dir="ltr"> so
    // "#WEX-..." never splits or flips inside RTL text; the root inherits page direction.
    const { container, getByText } = render(<OrderNumber value="WEX-261123-3353B" prefix="طلب" withHash />);
    const root = container.firstElementChild;
    expect(root).not.toBeNull();
    expect(getByText(/طلب/)).toBeDefined();

    const bdi = container.querySelector('bdi');
    expect(bdi).not.toBeNull();
    expect(bdi?.getAttribute('dir')).toBe('ltr');
    expect(bdi?.textContent).toBe('#WEX-261123-3353B');
  });
});

describe('OrderDate Component & Formatter', () => {
  it('formats order date line for plain text cleanly without broken parentheses', () => {
    const iso = '2026-11-23T14:30:00Z';
    const text = formatOrderDateLine(iso, 'تم الإنشاء:');
    expect(text).toContain('تم الإنشاء:');
    expect(text).not.toContain('(');
    expect(text).not.toContain(')');
  });

  it('renders date and time in isolated <bdi dir="ltr">', () => {
    const iso = '2026-11-23T14:30:00Z';
    const { container, getByText } = render(<OrderDate date={iso} label="تم الإنشاء:" showRelative />);
    const bdi = container.querySelector('bdi');
    expect(bdi).not.toBeNull();
    expect(bdi?.getAttribute('dir')).toBe('ltr');
    expect(bdi?.textContent?.length).toBeGreaterThan(0);

    expect(getByText('تم الإنشاء:')).toBeDefined();
  });
});
