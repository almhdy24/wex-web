import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AdminRatesPage from '../pages/admin/AdminRatesPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';
import AdminShippingZonesPage from '../pages/admin/AdminShippingZonesPage';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { MemoryRouter } from 'react-router-dom';

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  actionToast: vi.fn(),
};

const mockAuthAdmin = {
  user: { name: 'المدير العام', email: 'admin@wex.sd', role: 'admin' },
  isAdmin: true,
  isStaff: true,
  logout: vi.fn(),
};

describe('Phase 5: Exchange Rate, Settings & Shipping Zones Unit Tests', () => {
  it('AdminRatesPage renders title, "للإدارة فقط" badge, active rate display, and update form', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter>
            <AdminRatesPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toContain('سعر الصرف');
    expect(html).toContain('للإدارة فقط');
    expect(html).toContain('سعر الصرف المعتمد حالياً');
    expect(html).toContain('تحديث سعر الصرف');
  });

  it('AdminSettingsPage renders three independent sections with dedicated submit buttons', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter>
            <AdminSettingsPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toContain('معلومات المتجر والتواصل');
    expect(html).toContain('بيانات حساب بنكك للتحويلات');
    expect(html).toContain('تفضيلات التشغيل والتسعير');
    expect(html).toContain('حفظ بيانات المتجر');
    expect(html).toContain('حفظ بيانات بنكك');
    expect(html).toContain('حفظ تفضيلات التشغيل');
  });

  it('AdminShippingZonesPage renders title, add button, and data list', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter>
            <AdminShippingZonesPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toContain('مناطق ورسوم التوصيل');
    expect(html).toContain('إضافة منطقة جديدة');
  });
});
