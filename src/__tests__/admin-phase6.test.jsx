import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminAuditLogsPage from '../pages/admin/AdminAuditLogsPage';
import { RoleGuard } from '../components/common/RouteGuard';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  actionToast: vi.fn(),
};

const mockAuthAdmin = {
  user: { id: 1, name: 'المدير العام', email: 'admin@wex.sd', role: 'admin' },
  isAuthenticated: true,
  isAdmin: true,
  isStaff: true,
  loading: false,
  logout: vi.fn(),
};

const mockAuthCustomer = {
  user: { id: 2, name: 'محمد أحمد', email: 'customer@wex.sd', role: 'customer' },
  isAuthenticated: true,
  isAdmin: false,
  isStaff: false,
  loading: false,
  logout: vi.fn(),
};

describe('Phase 6: Users, Audit Log, Role-Based Navigation & Access Control Unit Tests', () => {
  it('AdminUsersPage renders title, search filters, and DataList controls', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter>
            <AdminUsersPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toContain('إدارة المستخدمين والصلاحيات');
    expect(html).toContain('كافة الأدوار');
  });

  it('AdminAuditLogsPage renders title, filter bar, and DataList', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter>
            <AdminAuditLogsPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toContain('سجل العمليات الإدارية');
    expect(html).toContain('تحديث السجل');
  });

  it('RoleGuard shows honest store return prompt when customer tries to access admin routes', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthCustomer}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter initialEntries={['/admin']}>
            <Routes>
              <Route
                path="/admin"
                element={
                  <RoleGuard allowedRoles={['admin', 'staff']}>
                    <div>محتوى الإدارة السري</div>
                  </RoleGuard>
                }
              />
            </Routes>
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toContain('هذه الصفحة مخصصة لإدارة المتجر');
    expect(html).toContain('العودة إلى المتجر');
    expect(html).not.toContain('محتوى الإدارة السري');
  });
});
