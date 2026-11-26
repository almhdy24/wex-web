/**
 * @vitest-environment jsdom
 *
 * Admin-managed content never reached the storefront: hero slides, home sections, FAQ and
 * the store pages (privacy/terms/returns/about) were edited in admin but the storefront
 * used hard-coded copies, had no page routes, and the catalog ignored ?type= / ?featured=.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';

vi.mock('../api/products', () => ({
  productsApi: {
    getFaq: vi.fn(),
    getPage: vi.fn(),
    getProducts: vi.fn().mockResolvedValue({ data: [], meta: { total: 0, last_page: 1 } }),
    getBrands: vi.fn().mockResolvedValue({ data: [] }),
    getCategories: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

import { productsApi } from '../api/products';
import FaqPage from '../pages/store/FaqPage';
import ContentPage from '../pages/store/ContentPage';

const withOutlet = (el) => (
  <MemoryRouter>
    <Routes>
      <Route element={<Outlet context={{ shopInfo: { lock_hours: 4 } }} />}>
        <Route path="*" element={el} />
      </Route>
    </Routes>
  </MemoryRouter>
);

beforeEach(() => {
  vi.clearAllMocks();
  window.scrollTo = window.scrollTo || (() => {});
  globalThis.IntersectionObserver = globalThis.IntersectionObserver || class { observe() {} unobserve() {} disconnect() {} };
});

describe('admin content reaches the storefront', () => {
  it('FAQ shows the admin entries (active only, admin order)', async () => {
    productsApi.getFaq.mockResolvedValue({
      data: [
        { id: 2, question: 'سؤال ثانٍ من الإدارة؟', answer: 'ج2', sort_order: 2, is_active: true },
        { id: 1, question: 'سؤال أول من الإدارة؟', answer: 'ج1', sort_order: 1, is_active: true },
        { id: 3, question: 'سؤال مخفي؟', answer: 'ج3', sort_order: 3, is_active: false },
      ],
    });
    render(withOutlet(<FaqPage />));
    const first = await screen.findByText('سؤال أول من الإدارة؟');
    const second = screen.getByText('سؤال ثانٍ من الإدارة؟');
    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText('سؤال مخفي؟')).toBeNull();
  });

  it('FAQ falls back to the built-in list when admin has none', async () => {
    productsApi.getFaq.mockResolvedValue({ data: [] });
    render(withOutlet(<FaqPage />));
    expect(await screen.findByText('كيف يعمل نظام تثبيت السعر؟')).toBeTruthy();
  });

  it('store page renders the admin body as paragraphs', async () => {
    productsApi.getPage.mockResolvedValue({ data: { slug: 'terms', title: 'شروط الاستخدام', body: 'فقرة أولى.\n\nفقرة ثانية.', is_active: true } });
    render(withOutlet(<ContentPage slug="terms" />));
    expect(await screen.findByText('فقرة أولى.')).toBeTruthy();
    expect(screen.getByText('فقرة ثانية.')).toBeTruthy();
    expect(productsApi.getPage).toHaveBeenCalledWith('terms');
  });

  it('missing or inactive page says so instead of an empty screen', async () => {
    productsApi.getPage.mockRejectedValue(Object.assign(new Error('x'), { status: 404 }));
    render(withOutlet(<ContentPage slug="nope" />));
    expect(await screen.findByText('هذه الصفحة غير متوفرة حاليًا.')).toBeTruthy();
  });
});
