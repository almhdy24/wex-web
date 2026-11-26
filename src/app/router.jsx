import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

// Layouts
import StoreLayout from '../layouts/StoreLayout';
import AdminLayout from '../layouts/AdminLayout';

// Common guards & errors
import { ProtectedRoute, RoleGuard, GuestRoute } from '../components/common/RouteGuard';
import NotFoundPage from '../pages/errors/NotFoundPage';
import RouteErrorPage from '../pages/errors/RouteErrorPage';
import OfflinePage from '../pages/errors/OfflinePage';
import Skeleton from '../components/common/Skeleton';

// Page Loader Fallback
function PageFallback() {
  return (
    <div style={{ maxWidth: '1200px', marginInline: 'auto', padding: 'var(--space-6) var(--space-4)' }}>
      <Skeleton height="36px" width="220px" style={{ marginBottom: 'var(--space-4)' }} />
      <Skeleton height="240px" borderRadius="var(--radius-lg)" />
    </div>
  );
}

const load = (Component) => (
  <Suspense fallback={<PageFallback />}>
    <Component />
  </Suspense>
);

// Store Pages (Lazy loaded for optimal bundle splitting)
const HomePage = lazy(() => import('../pages/store/HomePage'));
const CatalogPage = lazy(() => import('../pages/store/CatalogPage'));
const ProductDetailPage = lazy(() => import('../pages/store/ProductDetailPage'));
const CartPage = lazy(() => import('../pages/store/CartPage'));
const CheckoutPage = lazy(() => import('../pages/store/CheckoutPage'));
const OrdersPage = lazy(() => import('../pages/store/OrdersPage'));
const OrderDetailPage = lazy(() => import('../pages/store/OrderDetailPage'));
const AccountPage = lazy(() => import('../pages/store/AccountPage'));
const NotificationsPage = lazy(() => import('../pages/store/NotificationsPage'));
const ComparePage = lazy(() => import('../pages/store/ComparePage'));
const FavoritesPage = lazy(() => import('../pages/store/FavoritesPage'));
const FaqPage = lazy(() => import('../pages/store/FaqPage'));
const ContentPage = lazy(() => import('../pages/store/ContentPage'));

// Auth Pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const VerifyOtpPage = lazy(() => import('../pages/auth/VerifyOtpPage'));

// Admin Pages
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminOrdersPage = lazy(() => import('../pages/admin/AdminOrdersPage'));
const AdminOrderDetailPage = lazy(() => import('../pages/admin/AdminOrderDetailPage'));
const AdminPaymentsPage = lazy(() => import('../pages/admin/AdminPaymentsPage'));
const AdminProductsPage = lazy(() => import('../pages/admin/AdminProductsPage'));
const AdminProductFormPage = lazy(() => import('../pages/admin/AdminProductFormPage'));
const AdminCategoriesPage = lazy(() => import('../pages/admin/AdminCategoriesPage'));
const AdminBrandsPage = lazy(() => import('../pages/admin/AdminBrandsPage'));
const AdminRatesPage = lazy(() => import('../pages/admin/AdminRatesPage'));
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage'));
const AdminShippingZonesPage = lazy(() => import('../pages/admin/AdminShippingZonesPage'));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'));
const AdminAuditLogsPage = lazy(() => import('../pages/admin/AdminAuditLogsPage'));
const AdminPaymentAccountsPage = lazy(() => import('../pages/admin/AdminPaymentAccountsPage'));
const AdminAnnouncementsPage = lazy(() => import('../pages/admin/AdminAnnouncementsPage'));
const AdminRecentPurchasesPage = lazy(() => import('../pages/admin/AdminRecentPurchasesPage'));
const AdminHeroSlidesPage = lazy(() => import('../pages/admin/AdminHeroSlidesPage'));
const AdminHomeSectionsPage = lazy(() => import('../pages/admin/AdminHomeSectionsPage'));
const AdminFaqPage = lazy(() => import('../pages/admin/AdminFaqPage'));
const AdminPagesPage = lazy(() => import('../pages/admin/AdminPagesPage'));

export const router = createBrowserRouter([
  // Public Storefront Routes
  {
    path: '/',
    element: <StoreLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: load(HomePage) },
      { path: 'products', element: load(CatalogPage) },
      { path: 'catalog', element: load(CatalogPage) },
      { path: 'products/:slug', element: load(ProductDetailPage) },
      { path: 'compare', element: load(ComparePage) },
      { path: 'favorites', element: load(FavoritesPage) },
      { path: 'wishlist', element: load(FavoritesPage) },
      { path: 'faq', element: load(FaqPage) },
      // Store pages edited in admin (/admin/pages); there was no route for them.
      { path: 'p/:slug', element: load(ContentPage) },
      { path: 'about', element: <Suspense fallback={<PageFallback />}><ContentPage slug="about" /></Suspense> },
      { path: 'privacy-policy', element: <Suspense fallback={<PageFallback />}><ContentPage slug="privacy-policy" /></Suspense> },
      { path: 'terms', element: <Suspense fallback={<PageFallback />}><ContentPage slug="terms" /></Suspense> },
      { path: 'returns', element: <Suspense fallback={<PageFallback />}><ContentPage slug="returns" /></Suspense> },
      {
        path: 'login',
        element: (
          <GuestRoute>
            {load(LoginPage)}
          </GuestRoute>
        ),
      },
      {
        path: 'auth/verify',
        element: (
          <GuestRoute>
            {load(VerifyOtpPage)}
          </GuestRoute>
        ),
      },
      { path: 'cart', element: load(CartPage) },
      { path: 'checkout', element: load(CheckoutPage) },
      {
        path: 'orders',
        element: (
          <ProtectedRoute>
            {load(OrdersPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/:orderNumber',
        element: (
          <ProtectedRoute>
            {load(OrderDetailPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'account',
        element: (
          <ProtectedRoute>
            {load(AccountPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            {load(NotificationsPage)}
          </ProtectedRoute>
        ),
      },
      { path: 'offline', element: <OfflinePage /> },
      { path: '404', element: <NotFoundPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },

  // Administration Routes (Staff & Admin)
  {
    path: '/admin',
    element: (
      <RoleGuard allowedRoles={['staff', 'admin']}>
        <AdminLayout />
      </RoleGuard>
    ),
    errorElement: <RouteErrorPage homePath="/admin" />,
    children: [
      { index: true, element: load(AdminDashboardPage) },
      { path: 'orders', element: load(AdminOrdersPage) },
      { path: 'orders/:orderNumber', element: load(AdminOrderDetailPage) },
      { path: 'payments', element: load(AdminPaymentsPage) },
      { path: 'announcements', element: load(AdminAnnouncementsPage) },
      { path: 'recent-purchases', element: load(AdminRecentPurchasesPage) },

      // Admin Only Routes
      {
        path: 'payment-accounts',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {load(AdminPaymentAccountsPage)}
          </RoleGuard>
        ),
      },
      {
        path: 'hero-slides',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {load(AdminHeroSlidesPage)}
          </RoleGuard>
        ),
      },
      {
        path: 'home-sections',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {load(AdminHomeSectionsPage)}
          </RoleGuard>
        ),
      },
      {
        path: 'faq',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {load(AdminFaqPage)}
          </RoleGuard>
        ),
      },
      {
        path: 'pages',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {load(AdminPagesPage)}
          </RoleGuard>
        ),
      },
      {
        path: 'products',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {load(AdminProductsPage)}
          </RoleGuard>
        ),
      },
      {
        path: 'products/new',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {load(AdminProductFormPage)}
          </RoleGuard>
        ),
      },
      {
        path: 'products/:id/edit',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {load(AdminProductFormPage)}
          </RoleGuard>
        ),
      },
      {
        path: 'categories',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {load(AdminCategoriesPage)}
          </RoleGuard>
        ),
      },
      {
        path: 'brands',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {load(AdminBrandsPage)}
          </RoleGuard>
        ),
      },
      {
        path: 'rates',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {load(AdminRatesPage)}
          </RoleGuard>
        ),
      },
      {
        path: 'shipping-zones',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {load(AdminShippingZonesPage)}
          </RoleGuard>
        ),
      },
      {
        path: 'settings',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {load(AdminSettingsPage)}
          </RoleGuard>
        ),
      },
      {
        path: 'users',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {load(AdminUsersPage)}
          </RoleGuard>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {load(AdminAuditLogsPage)}
          </RoleGuard>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
