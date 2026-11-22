import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { swrCache } from '../utils/swrCache';
import AppBar from '../components/common/AppBar';
import Skeleton from '../components/common/Skeleton';
import ProductDetailPage from '../pages/store/ProductDetailPage';
import OrdersPage from '../pages/store/OrdersPage';
import { CartContext } from '../context/CartContext';
import { FavoritesContext } from '../context/FavoritesContext';
import { CompareContext } from '../context/CompareContext';
import { ToastContext } from '../context/ToastContext';

describe('Phase 4 Quality, Accessibility & Performance Tests', () => {
  beforeEach(() => {
    swrCache.clear();
  });

  describe('SWR Cache Utility', () => {
    it('stores and retrieves data with timestamp', () => {
      swrCache.set('test_key', { name: 'MacBook Pro' });
      const entry = swrCache.get('test_key');
      expect(entry).not.toBeNull();
      expect(entry.data.name).toBe('MacBook Pro');
      expect(entry.timestamp).toBeGreaterThan(0);
    });

    it('returns null for missing key', () => {
      expect(swrCache.get('non_existent')).toBeNull();
    });

    it('clears all cached entries cleanly', () => {
      swrCache.set('k1', 'v1');
      swrCache.set('k2', 'v2');
      swrCache.clear();
      expect(swrCache.get('k1')).toBeNull();
      expect(swrCache.get('k2')).toBeNull();
    });
  });

  describe('Landmark and Heading Hierarchy (Single H1)', () => {
    it('AppBar supports titleAs prop to avoid duplicate H1 when page has an H1', () => {
      const htmlH1 = renderToStaticMarkup(
        <MemoryRouter initialEntries={['/catalog']}>
          <AppBar title="كتالوج المنتجات" />
        </MemoryRouter>
      );
      expect(htmlH1).toContain('<h1');

      const htmlSpan = renderToStaticMarkup(
        <MemoryRouter initialEntries={['/catalog']}>
          <AppBar title="اسم الجهاز" titleAs="span" />
        </MemoryRouter>
      );
      expect(htmlSpan).not.toContain('<h1');
      expect(htmlSpan).toContain('<span');
      expect(htmlSpan).toContain('اسم الجهاز');
    });

    it('ProductDetailPage renders exactly one H1 (the product title)', () => {
      const mockProduct = {
        id: 1,
        slug: 'macbook-pro-m2',
        name: 'Apple MacBook Pro M2',
        price_sdg: 850000,
        stock_status: 'in_stock',
        stock_quantity: 3,
        condition: 'like_new',
        images: [{ image_url: 'https://example.com/laptop.jpg' }],
      };

      const html = renderToStaticMarkup(
        <MemoryRouter>
          <ToastContext.Provider value={{ success: () => {}, error: () => {} }}>
            <CartContext.Provider value={{ addItem: () => {} }}>
              <FavoritesContext.Provider value={{ isFavorite: () => false, toggleFavorite: () => {} }}>
                <CompareContext.Provider value={{ isInCompare: () => false, addToCompare: () => {} }}>
                  <ProductDetailPage initialProduct={mockProduct} initialLoading={false} />
                </CompareContext.Provider>
              </FavoritesContext.Provider>
            </CartContext.Provider>
          </ToastContext.Provider>
        </MemoryRouter>
      );

      const h1Count = (html.match(/<h1/g) || []).length;
      expect(h1Count).toBe(1);
      expect(html).toContain('Apple MacBook Pro M2');
    });
  });

  describe('Skeleton and Motion Quality', () => {
    it('shared Skeleton renders with accessible aria-hidden', () => {
      const html = renderToStaticMarkup(
        <Skeleton height="200px" borderRadius="var(--radius-panel)" />
      );
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('skeleton');
    });

    it('OrdersPage renders Skeleton components during loading', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <OrdersPage initialOrders={null} initialLoading={true} />
        </MemoryRouter>
      );
      expect(html).toContain('skeleton');
      expect(html).toContain('aria-hidden="true"');
    });
  });
});
