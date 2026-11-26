/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../api/admin', () => ({ adminApi: { getSetupStatus: vi.fn() } }));
import { adminApi } from '../api/admin';
import SetupChecklistBanner from '../components/admin/SetupChecklistBanner';

const renderBanner = () => render(<MemoryRouter><SetupChecklistBanner /></MemoryRouter>);

// Fresh installs keep ordering closed until setup is done; the admin must see what is missing.
describe('SetupChecklistBanner', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists missing required items with links to fix them', async () => {
    adminApi.getSetupStatus.mockResolvedValue({ data: { complete: false, missing: [
      { key: 'contact', label: 'رقم الهاتف أو الواتساب', required: true, link: '/admin/settings#settings-store' },
      { key: 'payment_account', label: 'حساب دفع بنكي مفعّل', required: true, link: '/admin/payment-accounts' },
    ] } });
    renderBanner();
    expect(await screen.findByText('أكمل إعداد المتجر')).toBeTruthy();
    expect(screen.getByText('حساب دفع بنكي مفعّل').closest('a').getAttribute('href')).toBe('/admin/payment-accounts');
  });

  it('renders nothing once setup is complete', async () => {
    adminApi.getSetupStatus.mockResolvedValue({ data: { complete: true, missing: [] } });
    const { container } = renderBanner();
    await new Promise((r) => setTimeout(r, 0));
    expect(container.textContent).toBe('');
  });
});
