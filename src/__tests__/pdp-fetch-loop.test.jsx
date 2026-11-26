/**
 * @vitest-environment jsdom
 *
 * WEB-PERF-01: ProductDetailPage refetched forever. loadData depended on
 * `cached?.data?.product`; every fetch stored a new object in swrCache, which changed
 * loadData's identity and re-ran the effect (3 API calls per loop, never idle).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { ToastContext } from '../context/ToastContext';
import { FavoritesContext } from '../context/FavoritesContext';
import { CompareContext } from '../context/CompareContext';
import { AuthContext } from '../context/AuthContext';
import { swrCache } from '../utils/swrCache';

vi.mock('../api/products', () => ({
  productsApi: {
    getProductDetail: vi.fn(),
    getShippingZones: vi.fn().mockResolvedValue({ data: [] }),
    getProducts: vi.fn(),
  },
}));
vi.mock('../api/shop', () => ({ shopApi: { getShop: vi.fn().mockResolvedValue({ data: {} }) } }));

import { productsApi } from '../api/products';
import ProductDetailPage from '../pages/store/ProductDetailPage';

const product = { id: 7, slug: 'dell-7490', name: 'Dell Latitude 7490', type: 'laptop', condition: 'used_imported', price_sdg: 500000, stock_status: 'in_stock', images: [], category: { id: 1, slug: 'laptops' } };

beforeEach(() => {
  vi.clearAllMocks();
  swrCache.clear();
  // Fresh object on every call, like a real network response.
  productsApi.getProductDetail.mockImplementation(() => Promise.resolve({ data: { ...product } }));
  productsApi.getProducts.mockImplementation(() => Promise.resolve({
    data: [{ ...product }, { id: 8, slug: 'hp-840', name: 'HP EliteBook 840 G5', price_sdg: 490000, stock_status: 'in_stock' }],
  }));
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
  window.scrollTo = window.scrollTo || (() => {});
  globalThis.IntersectionObserver = globalThis.IntersectionObserver || class { observe() {} unobserve() {} disconnect() {} };
});

describe('ProductDetailPage data loading', () => {
  it('fetches the product once per slug, not in a loop', async () => {
    render(
      <MemoryRouter initialEntries={['/products/dell-7490']}>
        <AuthContext.Provider value={{ user: null, isAuthenticated: false }}>
          <CartContext.Provider value={{ addItem: vi.fn() }}>
            <ToastContext.Provider value={{ success: vi.fn(), error: vi.fn() }}>
              <FavoritesContext.Provider value={{ toggleFavorite: vi.fn(), isFavorite: () => false }}>
                <CompareContext.Provider value={{ addToCompare: vi.fn(), removeFromCompare: vi.fn(), isInCompare: () => false }}>
                  <Routes>
                    <Route path="/products/:slug" element={<ProductDetailPage />} />
                  </Routes>
                </CompareContext.Provider>
              </FavoritesContext.Provider>
            </ToastContext.Provider>
          </CartContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    await screen.findAllByText(/Dell Latitude 7490/);
    // Let any re-render/effect cycles play out.
    await act(async () => { await new Promise((r) => setTimeout(r, 300)); });

    expect(productsApi.getProductDetail).toHaveBeenCalledTimes(1);
    // Similar devices: one category request, current product excluded, no loop.
    expect(productsApi.getProducts).toHaveBeenCalledTimes(1);
    expect(productsApi.getProducts.mock.calls[0][0]).toMatchObject({ category: 'laptops' });
    expect(await screen.findByText('أجهزة مشابهة')).toBeTruthy();
    expect(screen.getAllByText(/HP EliteBook 840 G5/).length).toBeGreaterThan(0);
    expect(document.querySelectorAll('a[href="/products/dell-7490"]').length).toBe(0);
  });

  it('Data Saver: skips the optional similar-devices request', async () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'connection');
    Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true });
    try {
      render(
        <MemoryRouter initialEntries={['/products/dell-7490']}>
          <AuthContext.Provider value={{ user: null, isAuthenticated: false }}>
            <CartContext.Provider value={{ addItem: vi.fn() }}>
              <ToastContext.Provider value={{ success: vi.fn(), error: vi.fn() }}>
                <FavoritesContext.Provider value={{ toggleFavorite: vi.fn(), isFavorite: () => false }}>
                  <CompareContext.Provider value={{ addToCompare: vi.fn(), removeFromCompare: vi.fn(), isInCompare: () => false }}>
                    <Routes>
                      <Route path="/products/:slug" element={<ProductDetailPage />} />
                    </Routes>
                  </CompareContext.Provider>
                </FavoritesContext.Provider>
              </ToastContext.Provider>
            </CartContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>,
      );
      await screen.findAllByText(/Dell Latitude 7490/);
      await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
      expect(productsApi.getProductDetail).toHaveBeenCalledTimes(1);
      expect(productsApi.getProducts).not.toHaveBeenCalled();
    } finally {
      if (original) Object.defineProperty(navigator, 'connection', original);
      else delete navigator.connection;
    }
  });
});
