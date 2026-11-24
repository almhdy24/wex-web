/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProductDetailPage from '../pages/store/ProductDetailPage';
import ProductCard from '../components/products/ProductCard';
import { productsApi } from '../api/products';
import { shopApi } from '../api/shop';
import { getProductUrl } from '../utils/productUrl';
import { CartContext } from '../context/CartContext';
import { ToastContext } from '../context/ToastContext';
import { FavoritesContext } from '../context/FavoritesContext';
import { CompareContext } from '../context/CompareContext';
import { AuthContext } from '../context/AuthContext';

vi.mock('../api/products', () => ({
  productsApi: {
    getProductDetail: vi.fn(),
    getShippingZones: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../api/shop', () => ({
  shopApi: {
    getShop: vi.fn().mockResolvedValue({ data: null }),
  },
}));

const dummyCart = {
  items: [],
  addItem: vi.fn(),
  removeItem: vi.fn(),
  isInCart: () => false,
  totalItems: 0,
};

const dummyToast = {
  addToast: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
};

const dummyFavorites = {
  isFavorite: () => false,
  toggleFavorite: vi.fn(),
  favorites: [],
};

const dummyCompare = {
  isInCompare: () => false,
  toggleCompare: vi.fn(),
  compareList: [],
};

const dummyAuth = {
  user: null,
  isAuthenticated: false,
};

function renderWithProviders(ui) {
  return render(
    <AuthContext.Provider value={dummyAuth}>
      <CartContext.Provider value={dummyCart}>
        <ToastContext.Provider value={dummyToast}>
          <FavoritesContext.Provider value={dummyFavorites}>
            <CompareContext.Provider value={dummyCompare}>
              {ui}
            </CompareContext.Provider>
          </FavoritesContext.Provider>
        </ToastContext.Provider>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}

describe('BUG 2: Product Route, Canonical Links & State Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dedicated "المنتج غير متوفر" state when API returns 404 (not generic crash)', async () => {
    const error404 = new Error('المنتج غير متوفر');
    error404.status = 404;
    error404.response = { status: 404 };
    productsApi.getProductDetail.mockRejectedValue(error404);

    renderWithProviders(
      <MemoryRouter initialEntries={['/products/non-existent-device']}>
        <Routes>
          <Route path="/products/:slug" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('المنتج غير متوفر')).toBeTruthy();
      expect(screen.getByText('تصفّح الأجهزة')).toBeTruthy();
    });
  });

  it('renders retry button when network error occurs', async () => {
    const networkError = new Error('فشل الاتصال بالخادم');
    networkError.status = 500;
    productsApi.getProductDetail.mockRejectedValue(networkError);

    renderWithProviders(
      <MemoryRouter initialEntries={['/products/kingston-ssd-256gb']}>
        <Routes>
          <Route path="/products/:slug" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('إعادة المحاولة')).toBeTruthy();
    });
  });

  it('ProductCard link matches canonical route pattern /products/:slug', () => {
    const productWithSlug = {
      id: 12,
      name: 'هارد SSD كينغستون 256 جيجابايت',
      slug: 'kingston-ssd-256gb',
      price_sdg: 45000,
      stock_status: 'in_stock',
    };

    renderWithProviders(
      <MemoryRouter>
        <ProductCard product={productWithSlug} />
      </MemoryRouter>
    );

    const links = screen.getAllByRole('link');
    const hasCanonicalLink = links.some((link) =>
      link.getAttribute('href') === '/products/kingston-ssd-256gb'
    );
    expect(hasCanonicalLink).toBe(true);
  });

  it('getProductUrl handles slug, fallback id, numeric id, and string slug', () => {
    expect(getProductUrl({ slug: 'thinkpad-t480', id: 5 })).toBe('/products/thinkpad-t480');
    expect(getProductUrl({ id: 5 })).toBe('/products/5');
    expect(getProductUrl('dell-xps-13')).toBe('/products/dell-xps-13');
    expect(getProductUrl(12)).toBe('/products/12');
    expect(getProductUrl(null)).toBe('/products');
  });
});
