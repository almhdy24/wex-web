/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Import providers
import { AuthContext } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext';
import { FavoritesProvider } from '../src/context/FavoritesContext';
import { CompareProvider } from '../src/context/CompareContext';
import { ToastProvider } from '../src/context/ToastContext';

// Import pages
import HomePage from '../src/pages/store/HomePage';
import CatalogPage from '../src/pages/store/CatalogPage';
import ProductDetailPage from '../src/pages/store/ProductDetailPage';
import CartPage from '../src/pages/store/CartPage';
import CheckoutPage from '../src/pages/store/CheckoutPage';
import OrdersPage from '../src/pages/store/OrdersPage';
import OrderDetailPage from '../src/pages/store/OrderDetailPage';
import AccountPage from '../src/pages/store/AccountPage';
import NotificationsPage from '../src/pages/store/NotificationsPage';
import ComparePage from '../src/pages/store/ComparePage';
import FavoritesPage from '../src/pages/store/FavoritesPage';
import FaqPage from '../src/pages/store/FaqPage';

import AdminDashboardPage from '../src/pages/admin/AdminDashboardPage';
import AdminOrdersPage from '../src/pages/admin/AdminOrdersPage';
import AdminOrderDetailPage from '../src/pages/admin/AdminOrderDetailPage';
import AdminPaymentsPage from '../src/pages/admin/AdminPaymentsPage';
import AdminProductsPage from '../src/pages/admin/AdminProductsPage';
import AdminProductFormPage from '../src/pages/admin/AdminProductFormPage';
import AdminCategoriesPage from '../src/pages/admin/AdminCategoriesPage';
import AdminBrandsPage from '../src/pages/admin/AdminBrandsPage';
import AdminRatesPage from '../src/pages/admin/AdminRatesPage';
import AdminSettingsPage from '../src/pages/admin/AdminSettingsPage';
import AdminShippingZonesPage from '../src/pages/admin/AdminShippingZonesPage';
import AdminUsersPage from '../src/pages/admin/AdminUsersPage';
import AdminAuditLogsPage from '../src/pages/admin/AdminAuditLogsPage';
import AdminPaymentAccountsPage from '../src/pages/admin/AdminPaymentAccountsPage';
import AdminHeroSlidesPage from '../src/pages/admin/AdminHeroSlidesPage';
import AdminHomeSectionsPage from '../src/pages/admin/AdminHomeSectionsPage';
import AdminFaqPage from '../src/pages/admin/AdminFaqPage';
import AdminPagesPage from '../src/pages/admin/AdminPagesPage';
import AdminRecentPurchasesPage from '../src/pages/admin/AdminRecentPurchasesPage';

// Load recorded fixtures helper
const fixturesDir = resolve(__dirname, 'fixtures');
function loadFixture(file) {
  const p = resolve(fixturesDir, file);
  if (existsSync(p)) {
    try {
      return JSON.parse(readFileSync(p, 'utf8'));
    } catch {
      return { success: true, data: [] };
    }
  }
  return { success: true, data: [] };
}

const shopFixture = loadFixture('shop.json');
const productsFixture = loadFixture('products.json');
const categoriesFixture = loadFixture('categories.json');
const brandsFixture = loadFixture('brands.json');
const shippingZonesFixture = loadFixture('shipping-zones.json');
const heroSlidesFixture = loadFixture('hero-slides.json');
const homeSectionsFixture = loadFixture('home-sections.json');
const faqFixture = loadFixture('faq.json');
const pagesFixture = loadFixture('pages.json');
const announcementsFixture = loadFixture('announcements.json');
const recentPurchasesFixture = loadFixture('recent-purchases.json');
const productDetailFixture = loadFixture('product-detail.json');
const customerOrdersFixture = loadFixture('customer-orders.json');
const adminDashboardFixture = loadFixture('admin-dashboard.json');
const adminOrdersFixture = loadFixture('admin-orders.json');
const adminRatesFixture = loadFixture('admin-rates.json');
const adminSettingsFixture = loadFixture('admin-settings.json');
const adminUsersFixture = loadFixture('admin-users.json');
const adminAuditLogsFixture = loadFixture('admin-audit-logs.json');
const adminPaymentAccountsFixture = loadFixture('admin-payment-accounts.json');

const server = setupServer(
  http.get('*/api/v1/shop', () => HttpResponse.json(shopFixture)),
  http.get('*/api/v1/products', () => HttpResponse.json(productsFixture)),
  http.get('*/api/v1/products/:slug', () => HttpResponse.json(productDetailFixture)),
  http.get('*/api/v1/categories', () => HttpResponse.json(categoriesFixture)),
  http.get('*/api/v1/brands', () => HttpResponse.json(brandsFixture)),
  http.get('*/api/v1/shipping-zones', () => HttpResponse.json(shippingZonesFixture)),
  http.get('*/api/v1/content/hero-slides', () => HttpResponse.json(heroSlidesFixture)),
  http.get('*/api/v1/content/home-sections', () => HttpResponse.json(homeSectionsFixture)),
  http.get('*/api/v1/content/faq', () => HttpResponse.json(faqFixture)),
  http.get('*/api/v1/content/pages', () => HttpResponse.json(pagesFixture)),
  http.get('*/api/v1/content/pages/:slug', () => HttpResponse.json({ success: true, data: { title: 'عن المتجر', body: 'نص تجريبي' } })),
  http.get('*/api/v1/announcements', () => HttpResponse.json(announcementsFixture)),
  http.get('*/api/v1/recent-purchases', () => HttpResponse.json(recentPurchasesFixture)),
  http.get('*/api/v1/orders', () => HttpResponse.json(customerOrdersFixture)),
  http.get('*/api/v1/orders/:orderNumber', () => HttpResponse.json({ success: true, data: { order_number: 'WEX-1001', status: 'pending_payment', total_sdg: 100000, items: [] } })),
  http.get('*/api/v1/notifications', () => HttpResponse.json({ success: true, data: [] })),
  http.get('*/api/v1/notifications/unread-count', () => HttpResponse.json({ success: true, data: { unread_count: 0 } })),
  http.get('*/api/v1/admin/dashboard', () => HttpResponse.json(adminDashboardFixture)),
  http.get('*/api/v1/admin/orders', () => HttpResponse.json(adminOrdersFixture)),
  http.get('*/api/v1/admin/orders/:orderNumber', () => HttpResponse.json({ success: true, data: { order_number: 'WEX-1001', status: 'pending_payment', total_sdg: 100000, items: [] } })),
  http.get('*/api/v1/admin/products', () => HttpResponse.json(productsFixture)),
  http.get('*/api/v1/admin/categories', () => HttpResponse.json(categoriesFixture)),
  http.get('*/api/v1/admin/brands', () => HttpResponse.json(brandsFixture)),
  http.get('*/api/v1/admin/rates', () => HttpResponse.json(adminRatesFixture)),
  http.get('*/api/v1/admin/settings', () => HttpResponse.json(adminSettingsFixture)),
  http.get('*/api/v1/admin/shipping-zones', () => HttpResponse.json(shippingZonesFixture)),
  http.get('*/api/v1/admin/users', () => HttpResponse.json(adminUsersFixture)),
  http.get('*/api/v1/admin/audit-logs', () => HttpResponse.json(adminAuditLogsFixture)),
  http.get('*/api/v1/admin/payment-accounts', () => HttpResponse.json(adminPaymentAccountsFixture)),
  http.get('*/api/v1/admin/hero-slides', () => HttpResponse.json(heroSlidesFixture)),
  http.get('*/api/v1/admin/home-sections', () => HttpResponse.json(homeSectionsFixture)),
  http.get('*/api/v1/admin/faq', () => HttpResponse.json(faqFixture)),
  http.get('*/api/v1/admin/pages', () => HttpResponse.json(pagesFixture)),
  http.get('*/api/v1/admin/recent-purchases', () => HttpResponse.json(recentPurchasesFixture))
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const forbiddenTextPattern = /is not a function|undefined|null|NaN|\[object|Failed to fetch|Network Error/;

function renderPage(ui, { route = '/', role = 'admin' } = {}) {
  const authVal = {
    user: { id: 1, name: 'مدير النظام', role, email: 'admin@wextechnology.com', phone: '0912345678' },
    isAuthenticated: true,
    token: 'test-token',
    login: () => {},
    logout: () => {},
  };

  return render(
    <AuthContext.Provider value={authVal}>
      <ToastProvider>
        <CartProvider>
          <FavoritesProvider>
            <CompareProvider>
              <MemoryRouter initialEntries={[route]}>
                {ui}
              </MemoryRouter>
            </CompareProvider>
          </FavoritesProvider>
        </CartProvider>
      </ToastProvider>
    </AuthContext.Provider>
  );
}

describe('Route Smoke Tests with Real API Fixtures', () => {
  const routesToTest = [
    { name: 'HomePage', path: '/', element: <HomePage /> },
    { name: 'CatalogPage', path: '/catalog', element: <CatalogPage /> },
    { name: 'ProductDetailPage', path: '/products/thinkpad-t480', element: <Routes><Route path="/products/:slug" element={<ProductDetailPage />} /></Routes> },
    { name: 'CartPage', path: '/cart', element: <CartPage /> },
    { name: 'CheckoutPage', path: '/checkout', element: <CheckoutPage /> },
    { name: 'OrdersPage', path: '/orders', element: <OrdersPage /> },
    { name: 'OrderDetailPage', path: '/orders/WEX-1001', element: <Routes><Route path="/orders/:orderNumber" element={<OrderDetailPage />} /></Routes> },
    { name: 'AccountPage', path: '/account', element: <AccountPage /> },
    { name: 'NotificationsPage', path: '/notifications', element: <NotificationsPage /> },
    { name: 'ComparePage', path: '/compare', element: <ComparePage /> },
    { name: 'FavoritesPage', path: '/favorites', element: <FavoritesPage /> },
    { name: 'FaqPage', path: '/faq', element: <FaqPage /> },

    // Admin routes
    { name: 'AdminDashboardPage', path: '/admin', element: <AdminDashboardPage /> },
    { name: 'AdminOrdersPage', path: '/admin/orders', element: <AdminOrdersPage /> },
    { name: 'AdminOrderDetailPage', path: '/admin/orders/WEX-1001', element: <Routes><Route path="/admin/orders/:orderNumber" element={<AdminOrderDetailPage />} /></Routes> },
    { name: 'AdminPaymentsPage', path: '/admin/payments', element: <AdminPaymentsPage /> },
    { name: 'AdminProductsPage', path: '/admin/products', element: <AdminProductsPage /> },
    { name: 'AdminProductFormPage', path: '/admin/products/new', element: <AdminProductFormPage /> },
    { name: 'AdminCategoriesPage', path: '/admin/categories', element: <AdminCategoriesPage /> },
    { name: 'AdminBrandsPage', path: '/admin/brands', element: <AdminBrandsPage /> },
    { name: 'AdminRatesPage', path: '/admin/rates', element: <AdminRatesPage /> },
    { name: 'AdminSettingsPage', path: '/admin/settings', element: <AdminSettingsPage /> },
    { name: 'AdminShippingZonesPage', path: '/admin/shipping-zones', element: <AdminShippingZonesPage /> },
    { name: 'AdminUsersPage', path: '/admin/users', element: <AdminUsersPage /> },
    { name: 'AdminAuditLogsPage', path: '/admin/audit-logs', element: <AdminAuditLogsPage /> },
    { name: 'AdminPaymentAccountsPage', path: '/admin/payment-accounts', element: <AdminPaymentAccountsPage /> },
    { name: 'AdminHeroSlidesPage', path: '/admin/hero-slides', element: <AdminHeroSlidesPage /> },
    { name: 'AdminHomeSectionsPage', path: '/admin/home-sections', element: <AdminHomeSectionsPage /> },
    { name: 'AdminFaqPage', path: '/admin/faq', element: <AdminFaqPage /> },
    { name: 'AdminPagesPage', path: '/admin/pages', element: <AdminPagesPage /> },
    { name: 'AdminRecentPurchasesPage', path: '/admin/recent-purchases', element: <AdminRecentPurchasesPage /> },
  ];

  for (const r of routesToTest) {
    it(`renders route ${r.name} (${r.path}) cleanly inside <Page> with main landmark`, async () => {
      const { container } = renderPage(r.element, { route: r.path });

      // Wait for any microtasks/async effects
      await waitFor(() => {
        expect(Boolean(container)).toBe(true);
      });

      // 1. Assert no ErrorBoundary / error card
      const errorCards = container.querySelectorAll('[data-testid="error-card"], .errorBoundary, .errorCard');
      expect(errorCards.length).toBe(0);

      // 2. Assert no forbidden error / undefined strings in text content
      const text = container.textContent || '';
      expect(text).not.toMatch(forbiddenTextPattern);

      // 3. Assert page has a main landmark
      const mainEl = container.querySelector('main, [role="main"]');
      expect(Boolean(mainEl)).toBe(true);

      // 4. Assert page content is inside the shared <Page> container (has data-page-container attribute)
      const pageContainer = container.querySelector('[data-page-container="true"]');
      expect(Boolean(pageContainer)).toBe(true);
    });
  }
});
