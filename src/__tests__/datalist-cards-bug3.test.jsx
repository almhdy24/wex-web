/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DataList from '../components/admin/DataList';

describe('BUG 3: Stray checkboxes and lone : labels in DataList admin cards', () => {
  const dummyColumns = [
    {
      key: 'select',
      label: <span data-testid="select-all-header">تحديد الكل</span>,
      render: () => <input type="checkbox" aria-label="تحديد الطلب" data-testid="row-checkbox" />,
    },
    {
      key: 'order_number',
      label: 'رقم الطلب',
      isPrimary: true,
      render: (row) => <span>#{row.order_number}</span>,
    },
    {
      key: 'customer',
      label: 'العميل',
      render: (row) => <span>{row.customer_name}</span>,
    },
    {
      key: 'status',
      label: 'الحالة',
      isStatus: true,
      render: (row) => <span>{row.status}</span>,
    },
    {
      key: 'actions',
      label: '', // empty label!
      render: () => <button>إجراء</button>,
    },
  ];

  const dummyData = [
    {
      id: 1,
      order_number: 'WEX-1001',
      customer_name: 'محمد أحمد',
      status: 'قيد المراجعة',
    },
  ];

  it('renders only ONE checkbox per card, placed in the card header, not inside body rows', () => {
    const { container } = render(
      <DataList columns={dummyColumns} data={dummyData} forceView="cards" />
    );

    const checkboxes = container.querySelectorAll('[data-testid="row-checkbox"]');
    expect(checkboxes.length).toBe(1);

    // Verify checkbox is inside the card header, not in card body
    const cardHeader = container.querySelector('header');
    expect(cardHeader).toBeTruthy();
    expect(cardHeader.querySelector('[data-testid="row-checkbox"]')).toBeTruthy();

    const cardBody = container.querySelector('[class*="cardBody"]');
    if (cardBody) {
      expect(cardBody.querySelector('[data-testid="row-checkbox"]')).toBeNull();
    }
  });

  it('never renders a lone colon ":" or empty label in card body rows', () => {
    const { container } = render(
      <DataList columns={dummyColumns} data={dummyData} forceView="cards" />
    );

    const labels = container.querySelectorAll('[class*="cardFieldLabel"]');
    labels.forEach((labelEl) => {
      const text = labelEl.textContent.trim();
      expect(text).not.toBe(':');
      expect(text).not.toBe('');
      expect(text.length).toBeGreaterThan(1);
    });
  });
});
