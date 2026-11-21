import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import CartPage, { formatCartDevicesCount } from '../pages/store/CartPage';
import CheckoutPage from '../pages/store/CheckoutPage';
import AuthSheet from '../components/auth/AuthSheet';
import { CartContext } from '../context/CartContext';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';

describe('Phase 4: Cart, Checkout & Auth Sheet Rescue', () => {
  const dummyItem = {
    id: 1,
    name: 'Dell Latitude 7490',
    slug: 'dell-latitude-7490',
    price_sdg: 450000,
    quantity: 1,
  };

  const dummyToast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  };

  const dummyCart = {
    items: [dummyItem],
    totalItems: 1,
    estimatedSubtotalSdg: 450000,
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    refreshCartPrices: vi.fn(),
  };

  const dummyAuthGuest = {
    user: null,
    isAuthenticated: false,
    loginWithSession: vi.fn(),
  };

  const dummyAuthUser = {
    user: { id: 10, name: 'أحمد', phone: '0912345678' },
    isAuthenticated: true,
    loginWithSession: vi.fn(),
  };

  describe('formatCartDevicesCount using pluralAr', () => {
    it('formats cart devices correctly for Arabic plurals', () => {
      expect(formatCartDevicesCount(0)).toBe('لا توجد أجهزة');
      expect(formatCartDevicesCount(1)).toBe('جهاز واحد');
      expect(formatCartDevicesCount(2)).toBe('جهازان');
      expect(formatCartDevicesCount(3)).toBe('3 أجهزة');
      expect(formatCartDevicesCount(10)).toBe('10 أجهزة');
      expect(formatCartDevicesCount(11)).toBe('11 جهازًا');
      expect(formatCartDevicesCount(25)).toBe('25 جهازًا');
    });
  });

  describe('CartPage Component', () => {
    it('renders title, summary rows, discount (3%), link to add more products, and button متابعة', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <AuthContext.Provider value={dummyAuthGuest}>
            <CartContext.Provider value={dummyCart}>
              <ToastContext.Provider value={dummyToast}>
                <CartPage />
              </ToastContext.Provider>
            </CartContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      expect(html).toContain('السلة');
      expect(html).toContain('المجموع (جهاز واحد)');
      expect(html).toContain('خصم التطبيق (3%)');
      expect(html).toContain('الإجمالي');
      expect(html).toContain('إضافة منتجات أخرى');
      expect(html).toContain('متابعة');

      // Zero price-lock repetition per Principle 1
      expect(html).not.toContain('يبقى السعر ثابتًا لمدة');
      expect(html).not.toContain('تثبيت السعر');
    });

    it('renders empty cart message when items array is empty', () => {
      const emptyCart = {
        ...dummyCart,
        items: [],
        totalItems: 0,
        estimatedSubtotalSdg: 0,
      };

      const html = renderToStaticMarkup(
        <MemoryRouter>
          <AuthContext.Provider value={dummyAuthGuest}>
            <CartContext.Provider value={emptyCart}>
              <ToastContext.Provider value={dummyToast}>
                <CartPage />
              </ToastContext.Provider>
            </CartContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      expect(html).toContain('السلة فارغة حاليًا.');
      expect(html).toContain('تصفّح الأجهزة');
    });
  });

  describe('CheckoutPage Component', () => {
    it('renders ONE page with title "تأكيد الطلب", pickup/delivery options, and single price-lock line above button', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <AuthContext.Provider value={dummyAuthUser}>
            <CartContext.Provider value={dummyCart}>
              <ToastContext.Provider value={dummyToast}>
                <CheckoutPage
                  initialShippingZones={[
                    { id: 1, name: 'أم درمان', delivery_fee_sdg: 5000 },
                  ]}
                  initialShopInfo={{
                    lock_hours: 4,
                  }}
                />
              </ToastContext.Provider>
            </CartContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      expect(html).toContain('تأكيد الطلب');

      // Section 1: طريقة الاستلام
      expect(html).toContain('طريقة الاستلام');
      expect(html).toContain('الاستلام من المحل');
      expect(html).toContain('مجانًا');
      expect(html).toContain('التوصيل');
      expect(html).toContain('حسب المنطقة');

      // Section 2: التواصل
      expect(html).toContain('التواصل');
      expect(html).toContain('رقم الهاتف');
      expect(html).toContain('نتواصل معك على هذا الرقم بشأن طلبك.');
      expect(html).toContain('0912345678');
      expect(html).toContain('ملاحظات (اختياري)');

      // Summary Card
      expect(html).toContain('ملخص الطلب');
      expect(html).toContain('المجموع');
      expect(html).toContain('خصم التطبيق (3%)');
      expect(html).toContain('رسوم التوصيل');
      expect(html).toContain('الإجمالي');

      // ONE line above the button
      expect(html).toContain('بعد التأكيد يُثبَّت السعر لمدة 4 ساعات لتحوّل المبلغ وترفع إشعار التحويل.');
      expect(html).toContain('تأكيد الطلب');

      // Removed old clutter
      expect(html).not.toContain('تسوق سريع ومريح');
      expect(html).not.toContain('ماذا بعد تثبيت السعر؟');
    });
  });

  describe('AuthSheet Component', () => {
    it('renders sign-in sheet with exact required copy', () => {
      const html = renderToStaticMarkup(
        <AuthContext.Provider value={dummyAuthGuest}>
          <ToastContext.Provider value={dummyToast}>
            <AuthSheet isOpen={true} onClose={() => {}} onSuccess={() => {}} />
          </ToastContext.Provider>
        </AuthContext.Provider>
      );

      expect(html).toContain('سجّل الدخول لإتمام الطلب');
      expect(html).toContain('لنربط الطلب بحسابك ونرسل لك التحديثات.');
      expect(html).toContain('المتابعة باستخدام Google');
      expect(html).toContain('المتابعة بالبريد الإلكتروني');
    });
  });
});
