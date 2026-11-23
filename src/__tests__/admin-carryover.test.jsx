/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminPaymentsPage from '../pages/admin/AdminPaymentsPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';
import AdminOrderDetailPage from '../pages/admin/AdminOrderDetailPage';
import { adminApi } from '../api/admin';
import { ToastContext } from '../context/ToastContext';

// Mock adminApi
vi.mock('../api/admin', () => ({
  adminApi: {
    getOrders: vi.fn(),
    getOrderDetail: vi.fn(),
    getPaymentProofImage: vi.fn(),
    reviewPaymentProof: vi.fn(),
    resetOrphanOrder: vi.fn(),
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    getPaymentAccounts: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('AdminPaymentsPage: Queue index clamp', () => {
  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.matchMedia = window.matchMedia || function() {
      return {
        matches: false,
        addListener: function() {},
        removeListener: function() {},
      };
    };
  });

  it('clamps currentIndex and points to the next item when the first item is approved without skipping', async () => {
    const queueOrders = [
      { order_number: '1001', customer_name: 'عميل 1', created_at: '2026-01-01T10:00:00Z' },
      { order_number: '1002', customer_name: 'عميل 2', created_at: '2026-01-01T11:00:00Z' },
      { order_number: '1003', customer_name: 'عميل 3', created_at: '2026-01-01T12:00:00Z' },
    ];

    adminApi.getOrders.mockResolvedValue({ data: [...queueOrders] });
    adminApi.getOrderDetail.mockImplementation((orderNumber) =>
      Promise.resolve({
        data: {
          order_number: orderNumber,
          customer_name: orderNumber === '1001' ? 'عميل 1' : 'عميل 2',
          proofs: [{ id: 10, status: 'pending', sender_name: 'محمد', reference_number: 'REF123' }],
          items: [],
          total_sdg: 50000,
        },
      })
    );
    adminApi.getPaymentProofImage.mockResolvedValue(new Blob(['fake'], { type: 'image/jpeg' }));
    adminApi.reviewPaymentProof.mockResolvedValue({ success: true });

    render(
      <MemoryRouter initialEntries={['/admin/payments']}>
        <ToastContext.Provider value={mockToast}>
          <Routes>
            <Route path="/admin/payments" element={<AdminPaymentsPage />} />
          </Routes>
        </ToastContext.Provider>
      </MemoryRouter>
    );

    // Initial item is #1001
    await waitFor(() => {
      expect(screen.getByText(/1001/)).toBeTruthy();
    });

    // Approve button (desktop)
    const approveBtn = screen.getByRole('button', { name: 'قبول التحويل وتأكيد الطلب' });
    fireEvent.click(approveBtn);

    // Confirm dialog appears
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /نعم، اعتماد التحويل/i })).toBeTruthy();
    });

    const confirmApproveBtn = screen.getByRole('button', { name: /نعم، اعتماد التحويل/i });
    fireEvent.click(confirmApproveBtn);

    // After approval of 1001, queue becomes [1002, 1003].
    // CurrentIndex is clamped to 0, which points to 1002 (never skipped!)
    await waitFor(() => {
      expect(adminApi.reviewPaymentProof).toHaveBeenCalledWith('1001', 10, { action: 'approve' });
      expect(screen.getByText(/1002/)).toBeTruthy();
    });
  }, 15000);
});

describe('AdminSettingsPage: Inspection Policy Preservation', () => {
  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.matchMedia = window.matchMedia || function() {
      return {
        matches: false,
        addListener: function() {},
        removeListener: function() {},
      };
    };
  });

  it('populates inspection_note from policy_inspection on load and preserves it', async () => {
    adminApi.getSettings.mockResolvedValue({
      data: {
        shop_name: 'ويكس للتكنولوجيا',
        policy_inspection: 'سياسة الفحص المعتمدة من الإدارة',
        policy_return: 'سياسة الاسترجاع المعتمدة',
        orders_enabled: true,
      },
    });

    render(
      <MemoryRouter initialEntries={['/admin/settings']}>
        <ToastContext.Provider value={mockToast}>
          <Routes>
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Routes>
        </ToastContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      const textarea = screen.getByLabelText(/ملاحظة المعاينة عند الاستلام/i);
      expect(textarea.value).toBe('سياسة الفحص المعتمدة من الإدارة');
    });
  });
});

describe('AdminOrderDetailPage: Printable Slip Phone Number', () => {
  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads shop phone number from settings rather than hardcoded value', async () => {
    adminApi.getOrderDetail.mockResolvedValue({
      data: {
        order_number: '9988',
        created_at: '2026-02-01T12:00:00Z',
        customer_name: 'أحمد علي',
        customer_phone: '0911111111',
        total_sdg: 75000,
        status: 'pending',
        items: [],
      },
    });

    adminApi.getSettings.mockResolvedValue({
      data: {
        shop_name: 'ويكس تكنولوجي أم درمان',
        shop_address: 'مجمع الواحة التجاري، الطابق الأول',
        shop_phone: '0919999999',
      },
    });

    render(
      <MemoryRouter initialEntries={['/admin/orders/9988']}>
        <ToastContext.Provider value={mockToast}>
          <Routes>
            <Route path="/admin/orders/:orderNumber" element={<AdminOrderDetailPage />} />
          </Routes>
        </ToastContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('0919999999')).toBeTruthy();
      expect(screen.getByText(/مجمع الواحة التجاري، الطابق الأول/)).toBeTruthy();
      // Verify hardcoded fake phone is NOT present
      expect(screen.queryByText('0912345678')).toBeNull();
    });
  });
});
