import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import DesktopHeader from '../components/desktop/DesktopHeader';
import CartDrawer from '../components/desktop/CartDrawer';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

describe('Desktop Shell & Navigation Components', () => {
  const dummyAuth = {
    user: { name: 'أحمد التاج', email: 'ahmed@example.com', phone: '0912345678' },
    isAuthenticated: true,
    logout: () => {},
  };

  const dummyCart = {
    items: [
      {
        id: 'p1',
        name: 'Dell Latitude 7420',
        slug: 'dell-latitude-7420',
        price_sdg: 450000,
        quantity: 1,
        image: null,
      },
    ],
    updateQuantity: () => {},
    removeItem: () => {},
    clearCart: () => {},
    totalItems: 1,
    estimatedSubtotalSdg: 450000,
  };

  describe('DesktopHeader component', () => {
    it('renders primary navigation links and search field', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <AuthContext.Provider value={dummyAuth}>
            <CartContext.Provider value={dummyCart}>
              <DesktopHeader onOpenCart={() => {}} />
            </CartContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      // Verify Brand Logo
      expect(html).toContain('ويكس تكنولوجي');

      // Verify Main Navigation
      expect(html).toContain('الرئيسية');
      expect(html).toContain('المتجر');
      expect(html).toContain('الملحقات');
      expect(html).toContain('طلباتي');

      // Verify Search
      expect(html).toContain('ابحث عن جهاز أو ماركة');

      // Verify Shop Hours & Status
      expect(html).toContain('السبت - الخميس: 9:00 ص - 9:00 م');
      expect(html).toContain('مول الواحة، الشهداء، أم درمان');
    });
  });

  describe('CartDrawer component', () => {
    it('renders empty cart state when no items', () => {
      const emptyCart = {
        items: [],
        totalItems: 0,
        estimatedSubtotalSdg: 0,
        updateQuantity: () => {},
        removeItem: () => {},
        clearCart: () => {},
      };

      const html = renderToStaticMarkup(
        <MemoryRouter>
          <CartContext.Provider value={emptyCart}>
            <CartDrawer isOpen={true} onClose={() => {}} />
          </CartContext.Provider>
        </MemoryRouter>
      );

      expect(html).toContain('السلة فارغة حاليًا');
      expect(html).toContain('إضافة منتجات أخرى');
    });

    it('renders cart items with SDG price, subtotal, 3% discount and checkout action', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <CartContext.Provider value={dummyCart}>
            <CartDrawer isOpen={true} onClose={() => {}} />
          </CartContext.Provider>
        </MemoryRouter>
      );

      expect(html).toContain('Dell Latitude 7420');
      expect(html).toContain('450,000 ج.س');
      expect(html).toContain('المجموع');
      expect(html).toContain('خصم التطبيق (3%)');
      expect(html).toContain('متابعة');
      expect(html).toContain('عرض السلة');
    });
  });
});
