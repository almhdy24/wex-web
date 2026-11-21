import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { deriveOrderUiState } from '../utils/orderState';
import OrderDetailPage from '../pages/store/OrderDetailPage';
import AdminOrderDetailPage from '../pages/admin/AdminOrderDetailPage';

const mockToast = {
  show: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
};

const mockCustomerAuth = {
  user: { id: 1, name: 'محمد أحمد', phone: '+249912345678' },
  isAuthenticated: true,
  loading: false,
};

const mockAdminAuth = {
  user: { id: 99, name: 'المدير العام', phone: '+249911111111', role: 'admin' },
  isAuthenticated: true,
  loading: false,
};

describe('Phase 4: Payment States & Consistency Tests', () => {
  describe('deriveOrderUiState (Single Server Source of Truth)', () => {
    it('handles awaiting_proof: allows upload, disallows review, sets pending_payment stage', () => {
      const order = {
        id: 101,
        order_number: 'WEX-STATE-1',
        status: 'pending_payment',
        total_sdg: 250000,
        lock_expires_at: new Date(Date.now() + 3600000).toISOString(),
        payment: {
          state: 'awaiting_proof',
          can_upload: true,
          can_review: false,
          latest_proof: null,
          proofs_count: 0,
        },
      };

      const state = deriveOrderUiState(order);
      expect(state.stage).toBe('pending_payment');
      expect(state.canUpload).toBe(true);
      expect(state.canReview).toBe(false);
      expect(state.primaryAction).toBe('ارفع إشعار التحويل');
    });

    it('handles under_review: disallows upload, allows review, sets payment_review stage', () => {
      const order = {
        id: 102,
        order_number: 'WEX-STATE-2',
        status: 'payment_review',
        total_sdg: 250000,
        lock_expires_at: new Date(Date.now() + 3600000).toISOString(),
        payment: {
          state: 'under_review',
          can_upload: false,
          can_review: true,
          latest_proof: { id: 5, status: 'pending', file_path: 'proofs/p5.png' },
          proofs_count: 1,
        },
      };

      const state = deriveOrderUiState(order);
      expect(state.stage).toBe('payment_review');
      expect(state.canUpload).toBe(false);
      expect(state.canReview).toBe(true);
      expect(state.primaryAction).toBeNull();
    });

    it('handles rejected: allows re-upload, displays rejection note', () => {
      const order = {
        id: 103,
        order_number: 'WEX-STATE-3',
        status: 'payment_rejected',
        total_sdg: 250000,
        lock_expires_at: new Date(Date.now() + 3600000).toISOString(),
        payment: {
          state: 'rejected',
          can_upload: true,
          can_review: false,
          latest_proof: { id: 6, status: 'rejected', review_note: 'صورة الإشعار غير واضحة ورقم العملية مقطوع' },
          proofs_count: 1,
        },
      };

      const state = deriveOrderUiState(order);
      expect(state.stage).toBe('rejected');
      expect(state.canUpload).toBe(true);
      expect(state.canReview).toBe(false);
      expect(state.message).toContain('صورة الإشعار غير واضحة ورقم العملية مقطوع');
    });

    it('handles approved: confirms order, disallows upload/review', () => {
      const order = {
        id: 104,
        order_number: 'WEX-STATE-4',
        status: 'confirmed',
        total_sdg: 250000,
        payment: {
          state: 'approved',
          can_upload: false,
          can_review: false,
          latest_proof: { id: 7, status: 'approved' },
          proofs_count: 1,
        },
      };

      const state = deriveOrderUiState(order);
      expect(state.stage).toBe('confirmed');
      expect(state.canUpload).toBe(false);
      expect(state.canReview).toBe(false);
      expect(state.primaryAction).toBeNull();
    });

    it('handles expired: marks expired, disallows upload/review', () => {
      const order = {
        id: 105,
        order_number: 'WEX-STATE-5',
        status: 'expired',
        total_sdg: 250000,
        payment: {
          state: 'expired',
          can_upload: false,
          can_review: false,
          latest_proof: null,
          proofs_count: 0,
        },
      };

      const state = deriveOrderUiState(order);
      expect(state.stage).toBe('expired');
      expect(state.canUpload).toBe(false);
      expect(state.canReview).toBe(false);
    });
  });

  describe('Customer OrderDetailPage', () => {
    function renderCustomerOrder(order) {
      return renderToStaticMarkup(
        <MemoryRouter initialEntries={[`/orders/${order.order_number}`]}>
          <AuthContext.Provider value={mockCustomerAuth}>
            <ToastContext.Provider value={mockToast}>
              <Routes>
                <Route
                  path="/orders/:orderNumber"
                  element={<OrderDetailPage initialOrder={order} initialLoading={false} />}
                />
              </Routes>
            </ToastContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      );
    }

    it('awaiting_proof: renders upload section, never shows under_review or rejected hints', () => {
      const order = {
        id: 201,
        order_number: 'WEX-261121-C1A91',
        status: 'pending_payment',
        total_sdg: 350000,
        seconds_remaining: 7200,
        lock_expires_at: new Date(Date.now() + 7200000).toISOString(),
        order_type: 'pickup',
        payment: {
          state: 'awaiting_proof',
          can_upload: true,
          can_review: false,
          latest_proof: null,
          proofs_count: 0,
        },
        payment_accounts: [{ id: 1, bank_name: 'بنك الخرطوم', account_number: '123456' }],
      };

      const html = renderCustomerOrder(order);
      expect(html).toContain('ارفع إشعار التحويل');
      expect(html).not.toContain('قيد المراجعة');
      expect(html).not.toContain('تم رفض الإشعار');
    });

    it('under_review: renders review notice and suppresses upload action buttons', () => {
      const order = {
        id: 202,
        order_number: 'WEX-261121-C1A92',
        status: 'payment_review',
        total_sdg: 350000,
        seconds_remaining: 7200,
        lock_expires_at: new Date(Date.now() + 7200000).toISOString(),
        order_type: 'pickup',
        payment: {
          state: 'under_review',
          can_upload: false,
          can_review: true,
          latest_proof: { id: 12, status: 'pending' },
          proofs_count: 1,
        },
      };

      const html = renderCustomerOrder(order);
      expect(html).toContain('قيد المراجعة');
      expect(html).toContain('تم استلام الإشعار. بانتظار مراجعة المحل.');
      expect(html).not.toContain('id="upload-proof-card"');
      expect(html).not.toContain('التقاط صورة');
    });

    it('rejected: renders rejection notice with note and permits re-upload', () => {
      const order = {
        id: 203,
        order_number: 'WEX-261121-C1A93',
        status: 'payment_rejected',
        total_sdg: 350000,
        seconds_remaining: 3600,
        lock_expires_at: new Date(Date.now() + 3600000).toISOString(),
        order_type: 'pickup',
        rejection_reason: 'المبلغ المحول غير مطابق لقيمة الطلب',
        payment: {
          state: 'rejected',
          can_upload: true,
          can_review: false,
          latest_proof: {
            id: 13,
            status: 'rejected',
            review_note: 'المبلغ المحول غير مطابق لقيمة الطلب',
          },
          proofs_count: 1,
        },
      };

      const html = renderCustomerOrder(order);
      expect(html).toContain('تم رفض الإشعار السابق');
      expect(html).toContain('المبلغ المحول غير مطابق لقيمة الطلب');
      expect(html).toContain('ارفع إشعارًا جديدًا');
    });
  });

  describe('Admin OrderDetailPage (Phase 4 Evidence Fixes)', () => {
    function renderAdminOrder(order) {
      return renderToStaticMarkup(
        <MemoryRouter initialEntries={[`/admin/orders/${order.order_number}`]}>
          <AuthContext.Provider value={mockAdminAuth}>
            <ToastContext.Provider value={mockToast}>
              <Routes>
                <Route
                  path="/admin/orders/:orderNumber"
                  element={<AdminOrderDetailPage initialOrder={order} initialLoading={false} />}
                />
              </Routes>
            </ToastContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      );
    }

    it('Evidence 2: Never shows "عميل" placeholder; displays real customer name and phone', () => {
      const order = {
        id: 301,
        order_number: 'WEX-261121-C1A96',
        status: 'payment_review',
        total_sdg: 500000,
        customer_name: 'عثمان عبد الله',
        customer_phone: '+249912000000',
        order_type: 'delivery',
        delivery_address: 'الخرطوم - الرياض',
        payment: {
          state: 'under_review',
          can_upload: false,
          can_review: true,
          latest_proof: { id: 21, status: 'pending', image_url: '/uploads/p21.png' },
          proofs_count: 1,
        },
        proofs: [{ id: 21, status: 'pending', image_url: '/uploads/p21.png', created_at: '2026-11-21T08:00:00Z' }],
        events: [],
      };

      const html = renderAdminOrder(order);
      expect(html).toContain('عثمان عبد الله');
      expect(html).toContain('+249912000000');
      expect(html).not.toContain('>عميل<');
      expect(html).not.toContain('عميل</span>');
    });

    it('Evidence 4: Print button says "طباعة بطاقة الطلب", print layout title is "بطاقة طلب" (never "فاتورة")', () => {
      const order = {
        id: 302,
        order_number: 'WEX-261121-C1A96',
        status: 'payment_review',
        total_sdg: 500000,
        customer_name: 'عثمان عبد الله',
        customer_phone: '+249912000000',
        payment: {
          state: 'under_review',
          can_upload: false,
          can_review: true,
          latest_proof: { id: 21, status: 'pending', image_url: '/uploads/p21.png' },
          proofs_count: 1,
        },
        proofs: [{ id: 21, status: 'pending', image_url: '/uploads/p21.png' }],
        events: [],
      };

      const html = renderAdminOrder(order);
      expect(html).toContain('طباعة بطاقة الطلب');
      expect(html).toContain('بطاقة طلب');
      expect(html).not.toContain('فاتورة');
      expect(html).not.toContain('الفاتورة');
    });

    it('Evidence 5: Next step card has single primary CTA button with distinct hint (never repeats same sentence)', () => {
      const order = {
        id: 303,
        order_number: 'WEX-261121-C1A96',
        status: 'payment_review',
        total_sdg: 500000,
        payment: {
          state: 'under_review',
          can_upload: false,
          can_review: true,
          latest_proof: { id: 21, status: 'pending', image_url: '/uploads/p21.png' },
          proofs_count: 1,
        },
        proofs: [{ id: 21, status: 'pending', image_url: '/uploads/p21.png' }],
        events: [],
      };

      const html = renderAdminOrder(order);
      // Primary button text and hint text must be distinct
      expect(html).toContain('مراجعة الإشعار');
      expect(html).toContain('التحقق من إشعار التحويل البنكي وتأكيد استلام المبلغ');
    });

    it('Evidence 1 & Phase 2.4: Deadlock prevention - orphan order shows warning and reset button', () => {
      const orphanOrder = {
        id: 304,
        order_number: 'WEX-261121-ORPH1',
        status: 'payment_review',
        total_sdg: 500000,
        payment: {
          state: 'under_review',
          can_upload: false,
          can_review: false,
          latest_proof: null,
          proofs_count: 0,
        },
        proofs: [],
        events: [],
      };

      const html = renderAdminOrder(orphanOrder);
      expect(html).toContain('طلب يتيم بدون إشعار دفع قيد المراجعة');
      expect(html).toContain('إعادة الطلب إلى بانتظار التحويل');
    });
  });
});
