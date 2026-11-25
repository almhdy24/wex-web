/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import DataList from '../components/admin/DataList';

// ADM-UX-01: on mobile cards only the small title navigated; tapping the card body did nothing.
describe('DataList mobile cards', () => {
  const columns = [
    { key: 'order_number', label: 'رقم الطلب', isPrimary: true },
    { key: 'customer', label: 'العميل' },
    { key: 'actions', label: 'إجراءات', isActions: true, render: () => <button type="button">إجراء</button> },
  ];
  const data = [{ id: 1, order_number: 'WEX-1', customer: 'أحمد' }];

  it('opens the row when the card body is tapped, once per tap, but not from the actions footer', () => {
    const onRowClick = vi.fn();
    render(<DataList columns={columns} data={data} onRowClick={onRowClick} forceView="cards" />);

    fireEvent.click(screen.getByText('أحمد'));
    expect(onRowClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('WEX-1'));
    expect(onRowClick).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByText('إجراء'));
    expect(onRowClick).toHaveBeenCalledTimes(2);
  });
});
