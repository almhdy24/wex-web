/**
 * @vitest-environment jsdom
 *
 * Home sections edited in admin (/admin/home-sections) reach the storefront; the hero is now the
 * promotions carousel (admin: /admin/promotions), which renders nothing when there are no promos.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { FavoritesContext } from '../context/FavoritesContext';
import { ToastContext } from '../context/ToastContext';

vi.mock('../api/promotions', () => ({
  promotionsApi: { list: vi.fn().mockResolvedValue([]), track: vi.fn() },
  promoHref: () => undefined,
}));
vi.mock('../api/shop', () => ({ shopApi: { getShop: vi.fn().mockResolvedValue({ data: { lock_hours: 4 } }) } }));
vi.mock('../api/products', () => ({
  productsApi: {
    getProducts: vi.fn(),
    getBrands: vi.fn().mockResolvedValue({ data: [] }),
    getHeroSlides: vi.fn(),
    getHomeSections: vi.fn(),
  },
}));

import { productsApi } from '../api/products';
import HomePage from '../pages/store/HomePage';

const laptop = { id: 1, slug: 'l1', name: 'Laptop One', type: 'laptop', price_sdg: 500000, stock_status: 'in_stock' };
const mouse = { id: 2, slug: 'm1', name: 'Mouse One', type: 'accessory', price_sdg: 20000, stock_status: 'in_stock' };

function renderHome() {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{ user: null, isAuthenticated: false }}>
        <CartContext.Provider value={{ totalItems: 0, addItem: vi.fn() }}>
          <FavoritesContext.Provider value={{ favoriteCount: 0, isFavorite: () => false, toggleFavorite: vi.fn() }}>
            <ToastContext.Provider value={{ success: vi.fn(), error: vi.fn() }}>
              <HomePage />
            </ToastContext.Provider>
          </FavoritesContext.Provider>
        </CartContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  window.scrollTo = window.scrollTo || (() => {});
  globalThis.IntersectionObserver = globalThis.IntersectionObserver || class { observe() {} unobserve() {} disconnect() {} };
  productsApi.getProducts.mockImplementation((q = {}) =>
    Promise.resolve({ data: q.type === 'accessory' ? [mouse] : q.type === 'laptop' ? [laptop] : [laptop, mouse] })
  );
});

describe('home page uses admin sections', () => {
  it('renders admin sections in admin order with their products', async () => {
    productsApi.getHomeSections.mockResolvedValue({
      data: [
        { id: 2, key: 'acc', title: 'قسم الملحقات', source: 'type', source_value: 'accessory', limit: 6, sort_order: 2, is_active: true },
        { id: 1, key: 'lap', title: 'قسم اللابتوبات', source: 'type', source_value: 'laptop', limit: 8, sort_order: 1, is_active: true },
        { id: 3, key: 'off', title: 'قسم مخفي', source: 'newest', limit: 4, sort_order: 3, is_active: false },
      ],
    });
    renderHome();
    const lap = await screen.findByText('قسم اللابتوبات');
    const acc = screen.getByText('قسم الملحقات');
    expect(lap.compareDocumentPosition(acc) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText('قسم مخفي')).toBeNull();
    expect(productsApi.getProducts).toHaveBeenCalledWith(expect.objectContaining({ type: 'accessory', per_page: 6 }));
    // Built-in rows are replaced, not duplicated.
    expect(screen.queryByText('وصل حديثاً')).toBeNull();
  });

  it('keeps the built-in rows when admin has none', async () => {
    productsApi.getHomeSections.mockResolvedValue({ data: [] });
    renderHome();
    expect(await screen.findByText('وصل حديثاً')).toBeTruthy();
  });
});
