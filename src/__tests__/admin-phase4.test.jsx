import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import AdminProductFormPage from '../pages/admin/AdminProductFormPage';
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
  user: { name: 'المدير العام', email: 'admin@wex.sd', role: 'admin' },
  isAdmin: true,
  isStaff: true,
  logout: vi.fn(),
};

describe('Phase 4: Products List & Multi-Section Product Form Unit Tests', () => {
  it('AdminProductsPage renders title, add button, and initial skeleton/controls', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter>
            <AdminProductsPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toContain('إدارة المنتجات والأجهزة');
    expect(html).toContain('إضافة منتج جديد');
  });

  it('AdminProductFormPage renders multi-section navigation, AED price input and admin-only badge', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter initialEntries={['/admin/products/new']}>
            <Routes>
              <Route path="/admin/products/new" element={<AdminProductFormPage />} />
            </Routes>
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toContain('البيانات الأساسية');
    expect(html).toContain('السعر والمخزون');
    expect(html).toContain('صور الجهاز');
    expect(html).toContain('المواصفات الفنية');
    expect(html).toContain('للإدارة فقط');
    expect(html).toContain('إنشاء المنتج');
  });
});
