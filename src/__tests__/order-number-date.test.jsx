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

  // VIS-03: one LTR isolate around "date time" put ص/م at the far right, so an Arabic
  // reader met "م 8:00 2026/11/24". Date isolated LTR, then the time in RTL flow.
  it('isolates the date LTR and the time (with ص/م) as its own RTL unit after it', () => {
    const iso = '2026-11-23T14:30:00Z';
    const { container } = render(<OrderDate date={iso} label="" showRelative={false} />);
    const [dateBdi, timeBdi] = container.querySelectorAll('bdi');
    expect(dateBdi.getAttribute('dir')).toBe('ltr');
    expect(dateBdi.textContent).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
    expect(timeBdi.getAttribute('dir')).toBe('rtl');
    expect(timeBdi.textContent).toMatch(/^\d{1,2}:\d{2} [صم]$/);
  });
});
