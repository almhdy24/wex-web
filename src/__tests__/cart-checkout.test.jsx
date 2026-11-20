import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import CartPage from '../pages/store/CartPage';
import CheckoutPage from '../pages/store/CheckoutPage';
import PendingOrderBanner from '../components/common/PendingOrderBanner';

const mockItem = {
  id: 1,
  name: 'Dell Latitude 7420',
  slug: 'dell-latitude-7420',
  price_sdg: 850000,
  quantity: 1,
  specs: [{ label: 'المعالج', value: 'i7 11th Gen' }],
};

describe('Cart & Checkout System Unit Tests', () => {
  let mockCartContext;
  let mockToastContext;
  let mockAuthContext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCartContext = {
      items: [mockItem],
      addItem: vi.fn(),
      restoreItem: vi.fn(),
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn(),
      totalItems: 1,
      estimatedSubtotalSdg: 850000,
      priceChanges: {},
      refreshCartPrices: vi.fn(),
      confirmPriceChange: vi.fn(),
      confirmAllPriceChanges: vi.fn(),
      hasUnconfirmedPriceChanges: false,
    };

    mockToastContext = {
      addToast: vi.fn(),
      removeToast: vi.fn(),
      showToast: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      actionToast: vi.fn(),
    };

    mockAuthContext = {
      user: { id: 1, name: 'أحمد', phone: '0912345678' },
      isAuthenticated: true,
      loading: false,
    };
  });

  const renderHtml = (ui, authOverride = {}) => {
    return renderToStaticMarkup(
      <MemoryRouter>
        <AuthContext.Provider value={{ ...mockAuthContext, ...authOverride }}>
          <ToastContext.Provider value={mockToastContext}>
            <CartContext.Provider value={mockCartContext}>
              {ui}
            </CartContext.Provider>
          </ToastContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  describe('CartPage component', () => {
    it('renders cart items and pricing breakdown correctly', () => {
      const html = renderHtml(<CartPage />);

      expect(html).toContain('سلة المشتريات');
      expect(html).toContain('Dell Latitude 7420');
      expect(html).toContain('850,000 ج.س');
      expect(html).toContain('خصم الطلب بالتطبيق (3%)');
      expect(html).toContain('ملخص السلة');
    });

    it('renders desktop checkout button and continue shopping link', () => {
      const html = renderHtml(<CartPage />);

      expect(html).toContain('متابعة تثبيت السعر والطلب');
      expect(html).toContain('إضافة أجهزة أو ملحقات أخرى إلى السلة');
    });
  });

  describe('CheckoutPage component', () => {
    it('renders 3-step progress bar and delivery options', () => {
      const html = renderHtml(<CheckoutPage />);

      expect(html).toContain('السلة');
      expect(html).toContain('بيانات الطلب');
      expect(html).toContain('تثبيت السعر والدفع');
      expect(html).toContain('استلام من المحل (مجاني)');
      expect(html).toContain('توصيل للعنوان');
      expect(html).toContain('ماذا بعد تثبيت السعر؟');
    });

    it('renders contact phone input and order review summary', () => {
      const html = renderHtml(<CheckoutPage />);

      expect(html).toContain('رقم هاتف التواصل والواتساب:');
      expect(html).toContain('مراجعة الطلب');
      expect(html).toContain('الإجمالي المطلوب تحويله:');
    });
  });

  describe('PendingOrderBanner component', () => {
    it('does not render banner if user is unauthenticated', () => {
      const html = renderHtml(<PendingOrderBanner />, {
        isAuthenticated: false,
        user: null,
      });

      expect(html).toBe('');
    });
  });
});
