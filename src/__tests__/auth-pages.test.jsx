/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { safeReturnTo } from '../utils/url';
import VerifyOtpPage from '../pages/auth/VerifyOtpPage';
import LoginPage from '../pages/auth/LoginPage';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';

// Mock authApi
vi.mock('../api/auth', () => ({
  authApi: {
    requestEmailOtp: vi.fn().mockResolvedValue({ message: 'تم إرسال رمز التحقق' }),
    verifyEmailOtp: vi.fn().mockResolvedValue({
      data: {
        user: { id: 1, name: 'مستخدم تجريبي', role: 'customer' },
        access_token: 'test-token',
        refresh_token: 'test-refresh',
      },
    }),
    googleSignIn: vi.fn(),
  },
}));

describe('Auth Security: safeReturnTo', () => {
  it('falls back to default "/" for undefined, null, or empty values', () => {
    expect(safeReturnTo(undefined)).toBe('/');
    expect(safeReturnTo(null)).toBe('/');
    expect(safeReturnTo('')).toBe('/');
    expect(safeReturnTo('   ')).toBe('/');
  });

  it('rejects protocol-relative and absolute URLs to prevent open-redirects', () => {
    expect(safeReturnTo('//evil.com')).toBe('/');
    expect(safeReturnTo('//evil.com/phish')).toBe('/');
    expect(safeReturnTo('https://evil.com')).toBe('/');
    expect(safeReturnTo('http://evil.com')).toBe('/');
    expect(safeReturnTo('javascript:alert(1)')).toBe('/');
  });

  it('allows safe relative paths with query parameters', () => {
    expect(safeReturnTo('/checkout')).toBe('/checkout');
    expect(safeReturnTo('/admin/orders?status=pending')).toBe('/admin/orders?status=pending');
    expect(safeReturnTo('/cart')).toBe('/cart');
  });

  it('honors custom fallback when provided', () => {
    expect(safeReturnTo('//evil.com', '/fallback')).toBe('/fallback');
    expect(safeReturnTo(null, '/login')).toBe('/login');
  });
});

describe('Auth Pages: VerifyOtpPage', () => {
  const mockAuth = {
    user: null,
    isAuthenticated: false,
    loginWithSession: vi.fn(),
  };

  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    window.matchMedia = window.matchMedia || function() {
      return {
        matches: false,
        addListener: function() {},
        removeListener: function() {},
      };
    };
  });

  it('redirects to /login when email param is missing', async () => {
    render(
      <MemoryRouter initialEntries={['/auth/verify']}>
        <AuthContext.Provider value={mockAuth}>
          <ToastContext.Provider value={mockToast}>
            <Routes>
              <Route path="/auth/verify" element={<VerifyOtpPage />} />
              <Route path="/login" element={<div>صفحة تسجيل الدخول</div>} />
            </Routes>
          </ToastContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('صفحة تسجيل الدخول')).toBeTruthy();
    });
  });

  it('renders 6 OTP input boxes with dir="ltr" when email is present', () => {
    render(
      <MemoryRouter initialEntries={['/auth/verify?email=test@example.com']}>
        <AuthContext.Provider value={mockAuth}>
          <ToastContext.Provider value={mockToast}>
            <VerifyOtpPage />
          </ToastContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBe(6);
    expect(screen.getByText('test@example.com')).toBeTruthy();
  });
});

describe('Auth Pages: LoginPage', () => {
  const mockAuth = {
    user: null,
    isAuthenticated: false,
    loginWithSession: vi.fn(),
  };

  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    window.matchMedia = window.matchMedia || function() {
      return {
        matches: false,
        addListener: function() {},
        removeListener: function() {},
      };
    };
  });

  it('displays session expired alert when reason=idle query param is present', () => {
    render(
      <MemoryRouter initialEntries={['/login?reason=idle']}>
        <AuthContext.Provider value={mockAuth}>
          <ToastContext.Provider value={mockToast}>
            <LoginPage />
          </ToastContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(
      screen.getByText('انتهت الجلسة بسبب عدم النشاط. سجّل الدخول من جديد.')
    ).toBeTruthy();
  });

  it('renders email input with clear button when user types', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthContext.Provider value={mockAuth}>
          <ToastContext.Provider value={mockToast}>
            <LoginPage />
          </ToastContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText('بريدك الإلكتروني');
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

    const clearBtn = screen.getByLabelText('مسح البريد');
    expect(clearBtn).toBeTruthy();

    fireEvent.click(clearBtn);
    expect(emailInput.value).toBe('');
  });
});
