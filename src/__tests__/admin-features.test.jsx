import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import AdminPaymentAccountsPage from '../pages/admin/AdminPaymentAccountsPage';
import AdminAnnouncementsPage from '../pages/admin/AdminAnnouncementsPage';
import AdminRecentPurchasesPage from '../pages/admin/AdminRecentPurchasesPage';
import AdminHeroSlidesPage from '../pages/admin/AdminHeroSlidesPage';
import AdminHomeSectionsPage from '../pages/admin/AdminHomeSectionsPage';
import AdminFaqPage from '../pages/admin/AdminFaqPage';
import AdminPagesPage from '../pages/admin/AdminPagesPage';

const mockAdminUser = {
  id: 1,
  name: 'المدير العام',
  phone: '0912345678',
  role: 'admin',
};

const mockStaffUser = {
  id: 2,
  name: 'موظف العمليات',
  phone: '0912345679',
  role: 'staff',
};

const mockAuthAdmin = {
  user: mockAdminUser,
  isAuthenticated: true,
  loading: false,
};

const mockAuthStaff = {
  user: mockStaffUser,
  isAuthenticated: true,
  loading: false,
};

const mockToast = {
  show: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
};

describe('Admin New Features Component Tests', () => {
  it('AdminPaymentAccountsPage renders for admin with title and add button', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter>
            <AdminPaymentAccountsPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toContain('إدارة حسابات الدفع البنكي');
    expect(html).toContain('إضافة حساب بنكي');
  });

  it('AdminPaymentAccountsPage guards staff role with polite message', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthStaff}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter>
            <AdminPaymentAccountsPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toContain('غير مصرح');
  });

  it('AdminAnnouncementsPage renders title and add button', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter>
            <AdminAnnouncementsPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toContain('إدارة الإعلانات والتنبيهات');
    expect(html).toContain('إضافة إعلان جديد');
  });

  it('AdminRecentPurchasesPage renders title and explanation', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter>
            <AdminRecentPurchasesPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toContain('النشاط الأخير ومشتريات العملاء');
    expect(html).toContain('بيانات حقيقية');
  });

  it('AdminHeroSlidesPage renders title and add button', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter>
            <AdminHeroSlidesPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toContain('شرائح الواجهة الرئيسية');
    expect(html).toContain('إضافة شريحة');
  });

  it('AdminHomeSectionsPage renders title and add button', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter>
            <AdminHomeSectionsPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toContain('أقسام وصفوف الصفحة الرئيسية');
    expect(html).toContain('إضافة قسم');
  });

  it('AdminFaqPage renders title and add button', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter>
            <AdminFaqPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toContain('الأسئلة الشائعة (FAQ)');
    expect(html).toContain('إضافة سؤال');
  });

  it('AdminPagesPage renders title and static pages management', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter>
            <AdminPagesPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toContain('إدارة الصفحات التعريفية والسياسات');
    expect(html).toContain('إضافة صفحة جديدة');
  });
});
