import { describe, it, expect } from 'vitest';
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

describe('Frontend Foundation Smoke Test', () => {
  it('verifies test runner is operational', () => {
    expect(true).toBe(true);
  });

  it('verifies admin pages are importable and defined', () => {
    expect(AdminDashboardPage).toBeDefined();
    expect(AdminOrdersPage).toBeDefined();
    expect(AdminOrderDetailPage).toBeDefined();
    expect(AdminPaymentsPage).toBeDefined();
    expect(AdminProductsPage).toBeDefined();
    expect(AdminProductFormPage).toBeDefined();
    expect(AdminCategoriesPage).toBeDefined();
    expect(AdminBrandsPage).toBeDefined();
    expect(AdminRatesPage).toBeDefined();
    expect(AdminSettingsPage).toBeDefined();
    expect(AdminShippingZonesPage).toBeDefined();
    expect(AdminUsersPage).toBeDefined();
    expect(AdminAuditLogsPage).toBeDefined();
  });
});

