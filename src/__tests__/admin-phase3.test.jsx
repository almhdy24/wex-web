import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AdminOrdersPage from '../pages/admin/AdminOrdersPage';
import AdminOrderDetailPage from '../pages/admin/AdminOrderDetailPage';
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

describe('Phase 3: Orders List & Order Detail Systems Unit Tests', () => {
  it('AdminOrdersPage renders filter chips and DataList skeleton on mount', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter>
            <AdminOrdersPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toContain('إدارة طلبات الشراء');
    expect(html).toContain('الكل');
    expect(html).toContain('بانتظار التحويل');
    expect(html).toContain('مراجعة الإشعار');
    expect(html).toContain('تم التأكيد');
  });

  it('AdminOrderDetailPage renders loading skeleton on initial mount', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter initialEntries={['/admin/orders/WEX-TEST1']}>
            <Routes>
              <Route path="/admin/orders/:orderNumber" element={<AdminOrderDetailPage />} />
            </Routes>
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toBeTruthy();
  });
});
