import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import OrderDetailPage from '../pages/store/OrderDetailPage';
import OrdersPage from '../pages/store/OrdersPage';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';

describe('Phase 5: Payment Screen, Orders List & Flow Tests', () => {
  const dummyToast = {
    success: vi.fn(),
    error: vi.fn(),
  };

  const dummyAuth = {
    user: { id: 1, name: 'أحمد', phone: '0912345678' },
    isAuthenticated: true,
  };

  const samplePendingOrder = {
    id: 42,
    order_number: 'WEX-261121-ABCD1',
    status: 'pending_payment',
    total_sdg: 487500,
    seconds_remaining: 14400,
    created_at: '2026-11-21T00:30:00Z',
    order_type: 'pickup',
    payment_accounts: [
      {
        id: 1,
        bank_name: 'بنك الخرطوم (بنكك)',
        account_name: 'متجر ويكس تكنولوجي',
        account_number: '2849102',
      },
    ],
  };

  const sampleExpiredOrder = {
    ...samplePendingOrder,
    status: 'cancelled',
    seconds_remaining: 0,
  };

  const sampleRejectedOrder = {
    ...samplePendingOrder,
    status: 'payment_rejected',
    rejection_reason: 'رقم الإشعار غير واضح',
  };

  function renderOrderDetail(order = samplePendingOrder) {
    return renderToStaticMarkup(
      <MemoryRouter initialEntries={[`/orders/${order.order_number}`]}>
        <AuthContext.Provider value={dummyAuth}>
          <ToastContext.Provider value={dummyToast}>
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

  function renderOrders(ordersList = [samplePendingOrder]) {
    return renderToStaticMarkup(
      <MemoryRouter>
        <AuthContext.Provider value={dummyAuth}>
          <ToastContext.Provider value={dummyToast}>
            <OrdersPage initialOrders={ordersList} initialLoading={false} />
          </ToastContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  }

  describe('Payment Screen (OrderDetailPage)', () => {
    it('renders header, dark gradient card with countdown and copyable amount', () => {
      const html = renderOrderDetail(samplePendingOrder);

      expect(html).toContain('طلب #WEX-261121-ABCD1');
      expect(html).toContain('المتبقي لتثبيت السعر');
      expect(html).toContain('04:00:00');
      expect(html).toContain('المبلغ المطلوب');
      expect(html).toContain('487,500 ج.س');
    });

    it('renders "حساب التحويل" card with copy button', () => {
      const html = renderOrderDetail(samplePendingOrder);

      expect(html).toContain('حساب التحويل');
      expect(html).toContain('بنك الخرطوم (بنكك)');
      expect(html).toContain('2849102');
      expect(html).toContain('متجر ويكس تكنولوجي');
    });

    it('renders "ارفع إشعار التحويل" card with required buttons and guidance', () => {
      const html = renderOrderDetail(samplePendingOrder);

      expect(html).toContain('ارفع إشعار التحويل');
      expect(html).toContain('صورة واضحة تُظهر المبلغ ورقم العملية.');
      expect(html).toContain('التقاط صورة');
      expect(html).toContain('اختيار من المعرض');
    });

    it('renders single line: بعد المراجعة نُشعرك بتأكيد الدفع', () => {
      const html = renderOrderDetail(samplePendingOrder);

      expect(html).toContain('بعد المراجعة نُشعرك بتأكيد الدفع.');
    });

    it('renders expired state with reorder action', () => {
      const html = renderOrderDetail(sampleExpiredOrder);

      expect(html).toContain('انتهت مهلة تثبيت السعر.');
      expect(html).toContain('أعد الطلب بالسعر الحالي');
    });

    it('renders rejected state with rejection note and prompt to reupload', () => {
      const html = renderOrderDetail(sampleRejectedOrder);

      expect(html).toContain('رقم الإشعار غير واضح');
      expect(html).toContain('ارفع إشعارًا جديدًا');
    });
  });

  describe('Orders List (OrdersPage)', () => {
    it('renders simple rows with number, date, status, total, and "ارفع إشعار التحويل" button for pending orders', () => {
      const html = renderOrders([samplePendingOrder]);

      expect(html).toContain('طلباتي');
      expect(html).toContain('#WEX-261121-ABCD1');
      expect(html).toContain('بانتظار التحويل');
      expect(html).toContain('487,500 ج.س');
      expect(html).toContain('ارفع إشعار التحويل');
    });

    it('renders empty orders state when customer has no orders', () => {
      const html = renderOrders([]);

      expect(html).toContain('لا توجد طلبات سابقة.');
      expect(html).toContain('تصفّح الأجهزة');
    });
  });
});
