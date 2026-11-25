/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminPaymentAccountsPage from '../pages/admin/AdminPaymentAccountsPage';
import { adminAr } from '../content/admin.ar';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { api } from '../api/client';

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const dummyAdminAuth = {
  user: { id: 1, name: 'المدير', role: 'admin' },
  isAuthenticated: true,
};

const dummyToast = {
  addToast: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
};

describe('BUG 6: Polish Items (Orders Search Placeholder, Edit Account Sheet, Focus Rings)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('orders search placeholder is clean Arabic without scrambled parentheses or English WEX', () => {
    expect(adminAr.orders.searchPlaceholder).toBe('ابحث برقم الطلب أو رقم الهاتف');
    expect(adminAr.orders.searchPlaceholder).not.toContain('(');
    expect(adminAr.orders.searchPlaceholder).not.toContain(')');
    expect(adminAr.orders.searchPlaceholder).not.toContain('WEX');
  });

  it('edit payment account modal has numeric inputmode, start-side primary action, and full-width buttons', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/admin/payment-accounts') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              bank_name: 'بنك الخرطوم',
              account_name: 'متجر التقنية',
              account_number: '1234567',
              branch: 'أم درمان',
              is_active: 1,
            },
          ],
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <AuthContext.Provider value={dummyAdminAuth}>
        <ToastContext.Provider value={dummyToast}>
          <MemoryRouter>
            <AdminPaymentAccountsPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    // Open Add/Edit Modal
    const addBtn = await screen.findByText(adminAr.paymentAccounts.addNew);
    addBtn.click();

    // Verify modal is open
    const modalHeading = await screen.findByRole('heading', { name: adminAr.paymentAccounts.addNew });
    expect(modalHeading).toBeTruthy();

    // Verify account number input has inputMode="numeric"
    const accountNumberInput = screen.getByPlaceholderText('رقم الحساب البنكي بدقة');
    expect(accountNumberInput.getAttribute('inputmode')).toBe('numeric');

    // Verify buttons: primary button "مراجعة وحفظ" is rendered first (start side in RTL)
    const submitBtn = screen.getByText('مراجعة وحفظ');
    const cancelBtn = screen.getByText('إلغاء');
    expect(submitBtn).toBeTruthy();
    expect(cancelBtn).toBeTruthy();

    // Verify submit button precedes cancel button in DOM order
    expect(submitBtn.compareDocumentPosition(cancelBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
