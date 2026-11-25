import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import FaqPage from '../pages/store/FaqPage';

describe('Phase 6: Order Detail & FAQ Systems Unit Tests', () => {
  describe('FaqPage component', () => {
    it('renders FAQ header and search input', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <FaqPage />
        </MemoryRouter>
      );

      expect(html).toContain('الأسئلة الشائعة');
      expect(html).toContain('البحث في الأسئلة الشائعة');
      expect(html).toContain('تثبيت السعر والحجز');
      expect(html).toContain('السداد عبر بنكك');
      expect(html).toContain('الاستلام والتوصيل');
      expect(html).toContain('الموقع والتوصيل');
    });

    it('renders key value propositions and support links from shop settings', () => {
      // FAQ contact links now come from StoreLayout's outlet context (admin settings),
      // never from hard-coded placeholder numbers.
      const html = renderToStaticMarkup(
        <MemoryRouter initialEntries={['/faq']}>
          <Routes>
            <Route element={<Outlet context={{ shopInfo: { whatsapp: '0911111111', phone: '0911111111' } }} />}>
              <Route path="/faq" element={<FaqPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(html).toContain('تثبيت السعر');
      expect(html).toContain('استلام مباشر');
      expect(html).toContain('مول الواحة، أم درمان');
      expect(html).toContain('تواصل عبر واتساب');
      expect(html).toContain('https://wa.me/249911111111');
    });

    it('hides support links when the shop has not configured numbers', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <FaqPage />
        </MemoryRouter>
      );
      expect(html).not.toContain('wa.me');
      expect(html).not.toContain('tel:');
    });
  });
});
