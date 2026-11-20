import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
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
      expect(html).toContain('الاستلام والمعاينة');
      expect(html).toContain('الموقع والتوصيل');
    });

    it('renders key value propositions and support links', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <FaqPage />
        </MemoryRouter>
      );

      expect(html).toContain('تثبيت السعر 4 ساعات');
      expect(html).toContain('معاينة وفحص مباشر');
      expect(html).toContain('مول الواحة، أم درمان');
      expect(html).toContain('تواصل عبر واتساب');
    });
  });
});
