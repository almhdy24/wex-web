import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import StoreLayout from '../layouts/StoreLayout';
import AdminLayout from '../layouts/AdminLayout';

// Common guards & errors
import { ProtectedRoute, RoleGuard, GuestRoute } from '../components/common/RouteGuard';
import NotFoundPage from '../pages/errors/NotFoundPage';
import OfflinePage from '../pages/errors/OfflinePage';

// Store Pages
import HomePage from '../pages/store/HomePage';
import CatalogPage from '../pages/store/CatalogPage';
import ProductDetailPage from '../pages/store/ProductDetailPage';
import CartPage from '../pages/store/CartPage';
import CheckoutPage from '../pages/store/CheckoutPage';
import OrdersPage from '../pages/store/OrdersPage';
import OrderDetailPage from '../pages/store/OrderDetailPage';
import AccountPage from '../pages/store/AccountPage';
import NotificationsPage from '../pages/store/NotificationsPage';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import VerifyOtpPage from '../pages/auth/VerifyOtpPage';

// Admin Pages
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminOrdersPage from '../pages/admin/AdminOrdersPage';
import AdminOrderDetailPage from '../pages/admin/AdminOrderDetailPage';
import AdminPaymentsPage from '../pages/admin/AdminPaymentsPage';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import AdminProductFormPage from '../pages/admin/AdminProductFormPage';
import AdminCategoriesPage from '../pages/admin/AdminCategoriesPage';
import AdminBrandsPage from '../pages/admin/AdminBrandsPage';
import AdminRatesPage from '../pages/admin/AdminRatesPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';
import AdminShippingZonesPage from '../pages/admin/AdminShippingZonesPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminAuditLogsPage from '../pages/admin/AdminAuditLogsPage';

export const router = createBrowserRouter([
  // Public Storefront Routes
  {
    path: '/',
    element: <StoreLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <CatalogPage /> },
      { path: 'products/:slug', element: <ProductDetailPage /> },
      {
        path: 'login',
        element: (
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        ),
      },
      {
        path: 'auth/verify',
        element: (
          <GuestRoute>
            <VerifyOtpPage />
          </GuestRoute>
        ),
      },
      { path: 'cart', element: <CartPage /> },
      {
        path: 'checkout',
        element: (
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders',
        element: (
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/:orderNumber',
        element: (
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'account',
        element: (
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <NotificationsPage />
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
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'orders/:orderNumber', element: <AdminOrderDetailPage /> },
      { path: 'payments', element: <AdminPaymentsPage /> },

      // Admin Only Routes
      {
        path: 'products',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <AdminProductsPage />
          </RoleGuard>
        ),
      },
      {
        path: 'products/new',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <AdminProductFormPage />
          </RoleGuard>
        ),
      },
      {
        path: 'products/:id/edit',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <AdminProductFormPage />
          </RoleGuard>
        ),
      },
      {
        path: 'categories',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <AdminCategoriesPage />
          </RoleGuard>
        ),
      },
      {
        path: 'brands',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <AdminBrandsPage />
          </RoleGuard>
        ),
      },
      {
        path: 'rates',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <AdminRatesPage />
          </RoleGuard>
        ),
      },
      {
        path: 'shipping-zones',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <AdminShippingZonesPage />
          </RoleGuard>
        ),
      },
      {
        path: 'settings',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <AdminSettingsPage />
          </RoleGuard>
        ),
      },
      {
        path: 'users',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <AdminUsersPage />
          </RoleGuard>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <AdminAuditLogsPage />
          </RoleGuard>
        ),
      },
    ],
  },
]);
