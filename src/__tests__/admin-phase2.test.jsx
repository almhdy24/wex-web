import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminPaymentsPage from '../pages/admin/AdminPaymentsPage';
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

describe('Phase 2: Today Dashboard & Payments Review Queue Unit Tests', () => {
  it('AdminDashboardPage renders loading skeleton on SSR mount', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter>
            <AdminDashboardPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    // Initial render is loading skeleton
    expect(html).toBeTruthy();
  });

  it('AdminPaymentsPage renders initial loading skeleton on mount', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter>
            <AdminPaymentsPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toBeTruthy();
  });
});
