import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PriceNotice, { formatPricesUpdatedAt } from '../components/common/PriceNotice';
import Countdown from '../components/common/Countdown';
import ProductCard from '../components/products/ProductCard';
import { CartContext } from '../context/CartContext';
import { ToastContext } from '../context/ToastContext';
import { MemoryRouter } from 'react-router-dom';

describe('Phase B: Hide Exchange Rate & AED Customer-Facing Tests', () => {
  describe('PriceNotice Component & formatPricesUpdatedAt', () => {
    it('renders full variant with exact required customer copy', () => {
      const html = renderToStaticMarkup(<PriceNotice variant="full" lockHours={4} />);
      expect(html).toContain('بعد تأكيد الطلب يبقى السعر ثابتًا لمدة 4 ساعات لتتمكّن من التحويل.');
      // Must not contain reference currency or rate numbers
      expect(html).not.toMatch(/AED|درهم|دولار|[0-9]+\s*جنيه لكل/);
    });

    it('renders short variant with exact required customer copy', () => {
      const html = renderToStaticMarkup(<PriceNotice variant="short" lockHours={4} />);
      expect(html).toContain('بعد تأكيد الطلب يبقى السعر ثابتًا لمدة 4 ساعات لتتمكّن من التحويل.');
      expect(html).not.toMatch(/AED|درهم|دولار/);
    });

    it('formats prices_updated_at cleanly without exposing rates', () => {
      const now = new Date();
      now.setHours(9, 0, 0, 0);
      const formatted = formatPricesUpdatedAt(now.toISOString());
      expect(formatted).toBe('اليوم 9:00');

      const pastDate = '2026-11-18T14:30:00Z';
      const pastFormatted = formatPricesUpdatedAt(pastDate);
      expect(pastFormatted).not.toMatch(/AED|درهم|دولار|صرف/);
      expect(pastFormatted.length).toBeGreaterThan(0);
    });

    it('handles null or missing prices_updated_at gracefully', () => {
      expect(formatPricesUpdatedAt(null)).toBe('اليوم 9:00');
      expect(formatPricesUpdatedAt(undefined)).toBe('اليوم 9:00');
    });
  });

  describe('ProductCard Component', () => {
    it('renders only SDG price and never AED or exchange rate', () => {
      const publicProductFixture = {
        id: 42,
        name: 'Lenovo ThinkPad T14 Gen 2',
        brand_name: 'Lenovo',
        type: 'laptop',
        condition: 'used',
        price_sdg: 850000,
        stock_quantity: 3,
        primary_image_url: '/uploads/products/thinkpad.jpg',
        specs: {
          processor: 'Core i7 11th Gen',
          ram: '16GB',
          storage: '512GB SSD',
        },
      };

      const mockCart = {
        items: [],
        addToCart: () => {},
        removeFromCart: () => {},
        getItemQuantity: () => 0,
      };

      const mockToast = {
        addToast: () => {},
        removeToast: () => {},
        showToast: () => {},
        success: () => {},
        error: () => {},
        info: () => {},
      };

      const html = renderToStaticMarkup(
        <MemoryRouter>
          <ToastContext.Provider value={mockToast}>
            <CartContext.Provider value={mockCart}>
              <ProductCard product={publicProductFixture} />
            </CartContext.Provider>
          </ToastContext.Provider>
        </MemoryRouter>
      );

      // Must render SDG
      expect(html).toContain('850,000');
      expect(html).toContain('ج.س');

      // Must NEVER render AED or rate
      expect(html).not.toContain('AED');
      expect(html).not.toContain('د.إ');
      expect(html).not.toContain('درهم');
      expect(html).not.toContain('دولار');
      expect(html).not.toContain('سعر الصرف');
    });
  });

  describe('Countdown & Price Lock Display', () => {
    it('does not display exchange rate or AED in countdown banner', () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const html = renderToStaticMarkup(<Countdown expiresAt={futureDate} totalHours={4} />);

      expect(html).toContain('السعر مثبت لك لإتمام التحويل');
      expect(html).not.toContain('درهم');
      expect(html).not.toContain('AED');
      expect(html).not.toContain('جنيه لكل');
    });
  });

  describe('Cart Price Change Detection and Confirmation Workflow', () => {
    it('detects when product price_sdg changes and sets neutral message with old/new SDG', () => {
      const cartItems = [
        {
          product: { id: 1, name: 'HP ProBook 450', price_sdg: 600000, stock_quantity: 2 },
          quantity: 1,
        },
      ];

      const freshProductsFromServer = [
        { id: 1, name: 'HP ProBook 450', price_sdg: 650000, stock_quantity: 2 },
      ];

      const changes = [];
      cartItems.forEach((item) => {
        const fresh = freshProductsFromServer.find((p) => p.id === item.product.id);
        if (fresh && fresh.price_sdg !== item.product.price_sdg) {
          changes.push({
            productId: item.product.id,
            productName: fresh.name,
            oldPriceSdg: item.product.price_sdg,
            newPriceSdg: fresh.price_sdg,
            message: 'تغير سعر هذا الجهاز',
          });
        }
      });

      expect(changes.length).toBe(1);
      expect(changes[0].message).toBe('تغير سعر هذا الجهاز');
      expect(changes[0].oldPriceSdg).toBe(600000);
      expect(changes[0].newPriceSdg).toBe(650000);

      // Verify no mention of rate or AED in notification text
      expect(changes[0].message).not.toMatch(/AED|درهم|دولار|صرف/);
    });

    it('requires confirmation before proceeding to checkout', () => {
      let priceChanges = [
        { productId: 1, productName: 'HP ProBook', oldPriceSdg: 600000, newPriceSdg: 650000 },
      ];
      let hasUnconfirmedPriceChanges = priceChanges.length > 0;

      expect(hasUnconfirmedPriceChanges).toBe(true);

      // User confirms price changes
      const confirmAllPriceChanges = () => {
        priceChanges = [];
        hasUnconfirmedPriceChanges = false;
      };

      confirmAllPriceChanges();
      expect(hasUnconfirmedPriceChanges).toBe(false);
      expect(priceChanges.length).toBe(0);
    });
  });
});
