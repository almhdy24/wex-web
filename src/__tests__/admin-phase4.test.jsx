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

  it('AdminProductFormPage starts with the category-first step and renders the stepper once a type is chosen', () => {
    const render = (entry) => renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter initialEntries={[entry]}>
            <Routes>
              <Route path="/admin/products/new" element={<AdminProductFormPage />} />
            </Routes>
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    const step0 = render('/admin/products/new');
    expect(step0).toContain('ماذا تريد أن تضيف؟');
    ['حاسوب', 'هاتف', 'ملحق'].forEach((l) => expect(step0).toContain(l));

    const html = render('/admin/products/new?type=laptop');
    ['التصنيف', 'الصور', 'المعلومات الأساسية', 'المواصفات', 'السعر والمخزون', 'المراجعة والنشر'].forEach((l) => {
      expect(html).toContain(l);
    });
    expect(html).toContain('حفظ كمسودة');
    expect(html).toContain('نشر');
  });
});
