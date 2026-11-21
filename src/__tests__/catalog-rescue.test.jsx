import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CatalogPage, { formatResultsCount } from '../pages/store/CatalogPage';
import ProductDetailPage from '../pages/store/ProductDetailPage';
import { CartContext } from '../context/CartContext';
import { ToastContext } from '../context/ToastContext';
import { FavoritesContext } from '../context/FavoritesContext';
import { CompareContext } from '../context/CompareContext';
import { AuthContext } from '../context/AuthContext';

describe('Phase 3: Catalog, Filter Sheet & Product Detail Rescue', () => {
  const dummyProduct = {
    id: 101,
    name: 'Dell Latitude 7490',
    slug: 'dell-latitude-7490',
    type: 'laptop',
    condition: 'used_imported',
    price_sdg: 487500,
    stock_status: 'in_stock',
    stock_quantity: 3,
    processor: 'Intel Core i5-8350U',
    ram: '8GB',
    storage: '256GB SSD',
    gpu: 'Intel UHD Graphics 620',
    screen: '14" FHD',
    battery: '42Wh',
    warranty_text: 'معاينة عند الاستلام',
  };

  const dummyCart = {
    addItem: vi.fn(),
  };

  const dummyToast = {
    success: vi.fn(),
    error: vi.fn(),
  };

  const dummyFavorites = {
    isFavorite: () => false,
    toggleFavorite: vi.fn(),
  };

  const dummyCompare = {
    isInCompare: () => false,
    addToCompare: vi.fn(),
    removeFromCompare: vi.fn(),
  };

  const dummyAuth = {
    user: null,
    isAuthenticated: false,
  };

  function renderCatalog(props = {}) {
    return renderToStaticMarkup(
      <MemoryRouter>
        <AuthContext.Provider value={dummyAuth}>
          <CartContext.Provider value={dummyCart}>
            <ToastContext.Provider value={dummyToast}>
              <FavoritesContext.Provider value={dummyFavorites}>
                <CompareContext.Provider value={dummyCompare}>
                  <CatalogPage {...props} />
                </CompareContext.Provider>
              </FavoritesContext.Provider>
            </ToastContext.Provider>
          </CartContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  }

  function renderProductDetail(product = dummyProduct) {
    return renderToStaticMarkup(
      <MemoryRouter initialEntries={[`/products/${product.slug}`]}>
        <AuthContext.Provider value={dummyAuth}>
          <CartContext.Provider value={dummyCart}>
            <ToastContext.Provider value={dummyToast}>
              <FavoritesContext.Provider value={dummyFavorites}>
                <CompareContext.Provider value={dummyCompare}>
                  <Routes>
                    <Route
                      path="/products/:slug"
                      element={
                        <ProductDetailPage
                          initialProduct={product}
                          initialShopInfo={{
                            address: 'مول الواحة، الشهداء، أم درمان',
                            business_hours: 'السبت - الخميس: 9:00 ص - 9:00 م',
                          }}
                          initialShippingZones={[
                            { id: 1, name: 'أم درمان' },
                            { id: 2, name: 'الخرطوم' },
                          ]}
                          initialLoading={false}
                        />
                      }
                    />
                  </Routes>
                </CompareContext.Provider>
              </FavoritesContext.Provider>
            </ToastContext.Provider>
          </CartContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  }

  describe('formatResultsCount using pluralAr', () => {
    it('formats results count correctly for Arabic plurals', () => {
      expect(formatResultsCount(0)).toBe('لا توجد نتائج');
      expect(formatResultsCount(1)).toBe('نتيجة واحدة');
      expect(formatResultsCount(2)).toBe('نتيجتان');
      expect(formatResultsCount(3)).toBe('3 نتائج');
      expect(formatResultsCount(10)).toBe('10 نتائج');
      expect(formatResultsCount(14)).toBe('14 نتيجة');
      expect(formatResultsCount(100)).toBe('100 نتيجة');
    });
  });

  describe('CatalogPage Component', () => {
    it('renders title, single search input, and exactly one type chip row', () => {
      const html = renderCatalog({
        initialProducts: [dummyProduct],
        initialLoading: false,
      });

      expect(html).toContain('الأجهزة');
      expect(html).toContain('ابحث عن جهاز أو ماركة');

      // Single type chip row: الكل، لابتوبات، هواتف، ملحقات
      expect(html).toContain('الكل');
      expect(html).toContain('لابتوبات');
      expect(html).toContain('هواتف');
      expect(html).toContain('ملحقات');

      // "تصفية" button
      expect(html).toContain('تصفية');
    });

    it('renders empty state when no products match', () => {
      const html = renderCatalog({
        initialProducts: [],
        initialLoading: false,
      });

      expect(html).toContain('لا توجد أجهزة مطابقة. جرّب تغيير التصفية.');
      expect(html).toContain('مسح التصفية');
    });

    it('renders products with price on one line and "أضف" button', () => {
      const html = renderCatalog({
        initialProducts: [dummyProduct],
        initialLoading: false,
      });

      expect(html).toContain('Dell Latitude 7490');
      expect(html).toContain('487,500 ج.س');
      expect(html).toContain('أضف');
    });
  });

  describe('ProductDetailPage Component', () => {
    it('renders price with caption: السعر قابل للتغيير حتى تأكيد الطلب', () => {
      const html = renderProductDetail();

      expect(html).toContain('487,500 ج.س');
      expect(html).toContain('السعر قابل للتغيير حتى تأكيد الطلب.');
      // Must not leak the price lock explanation here per Principle 1
      expect(html).not.toContain('يبقى السعر ثابتًا لمدة');
    });

    it('renders tabs for specs and factual delivery information', () => {
      const html = renderProductDetail();

      expect(html).toContain('المواصفات');
      expect(html).toContain('الاستلام والتوصيل');

      // Spec labels
      expect(html).toContain('المعالج');
      expect(html).toContain('Intel Core i5-8350U');
      expect(html).toContain('الذاكرة العشوائية');
      expect(html).toContain('8GB');
      expect(html).toContain('التخزين');
      expect(html).toContain('256GB SSD');
      expect(html).toContain('كرت الشاشة');
      expect(html).toContain('الشاشة');
      expect(html).toContain('البطارية');

      // Action buttons
      expect(html).toContain('أضف إلى السلة');
      expect(html).toContain('اطلب الآن');
      expect(html).toContain('مقارنة');
    });
  });
});
