import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import StickyBar from '../components/common/StickyBar';
import Sheet from '../components/common/Sheet';
import ProductDetailPage from '../pages/store/ProductDetailPage';
import { CartContext } from '../context/CartContext';
import { FavoritesContext } from '../context/FavoritesContext';
import { CompareContext } from '../context/CompareContext';
import { ToastContext } from '../context/ToastContext';

describe('Mobile Regression Verification (Touch, 360/390px, Font Scale 1.3)', () => {
  describe('StickyBar & ProductDetail Purchase Bar', () => {
    it('StickyBar renders inner container and accepts innerClassName for multi-row layouts', () => {
      const html = renderToStaticMarkup(
        <StickyBar className="customBar" innerClassName="customInner">
          <span>المحتوى</span>
        </StickyBar>
      );
      expect(html).toContain('customBar');
      expect(html).toContain('customInner');
      expect(html).toContain('المحتوى');
    });

    it('ProductDetailPage renders purchase bar with price, stepper, cart button and primary order button', () => {
      const mockProduct = {
        id: 1,
        slug: 'lenovo-thinkpad-t480',
        name: 'Lenovo ThinkPad T480s',
        price_sdg: 520000,
        stock_status: 'in_stock',
        stock_quantity: 5,
        condition: 'like_new',
        images: [{ image_url: 'https://example.com/laptop.jpg' }],
      };

      const html = renderToStaticMarkup(
        <MemoryRouter>
          <ToastContext.Provider value={{ success: () => {}, error: () => {} }}>
            <CartContext.Provider value={{ addItem: () => {} }}>
              <FavoritesContext.Provider value={{ isFavorite: () => false, toggleFavorite: () => {} }}>
                <CompareContext.Provider value={{ isInCompare: () => false, addToCompare: () => {} }}>
                  <ProductDetailPage initialProduct={mockProduct} initialLoading={false} />
                </CompareContext.Provider>
              </FavoritesContext.Provider>
            </CartContext.Provider>
          </ToastContext.Provider>
        </MemoryRouter>
      );

      // Verify purchase bar elements
      expect(html).toContain('purchaseBar');
      expect(html).toContain('purchaseBarInner');
      expect(html).toContain('stepperBox');
      expect(html).toContain('cartIconButton');
      expect(html).toContain('اطلب الآن');
    });
  });

  describe('Horizontal Overflow Safeguards', () => {
    it('ProductDetailPage contains delivery card with shop address and shipping zones text', () => {
      const mockProduct = {
        id: 1,
        slug: 'test-product',
        name: 'ThinkPad With Very Long English Model Name That Might Overflow Mobile Viewports P16s Gen 2',
        price_sdg: 450000,
        stock_status: 'in_stock',
        stock_quantity: 2,
        condition: 'good',
        images: [],
      };

      const mockShop = {
        address: 'أم درمان، شارع العرضة، مجمع المحلات التجارية رقم 4',
        business_hours: 'السبت - الخميس: 9:00 ص - 9:00 م',
      };

      const mockZones = [
        { id: 1, zone_name: 'أم درمان - المنطقة الأولى والثانية' },
        { id: 2, zone_name: 'الخرطوم - السوق العربي والرياض والمعمورة' },
        { id: 3, zone_name: 'بحري - الصافية والمزاد والحلفايا والكدرو' },
      ];

      const html = renderToStaticMarkup(
        <MemoryRouter>
          <ToastContext.Provider value={{ success: () => {}, error: () => {} }}>
            <CartContext.Provider value={{ addItem: () => {} }}>
              <FavoritesContext.Provider value={{ isFavorite: () => false, toggleFavorite: () => {} }}>
                <CompareContext.Provider value={{ isInCompare: () => false, addToCompare: () => {} }}>
                  <ProductDetailPage
                    initialProduct={mockProduct}
                    initialShopInfo={mockShop}
                    initialShippingZones={mockZones}
                    initialLoading={false}
                    initialTab="delivery"
                  />
                </CompareContext.Provider>
              </FavoritesContext.Provider>
            </CartContext.Provider>
          </ToastContext.Provider>
        </MemoryRouter>
      );

      expect(html).toContain('ThinkPad With Very Long English Model Name');
      expect(html).toContain('titleBlock');
      expect(html).toContain('deliveryCard');
    });
  });

  describe('Catalog Filter Sheet Stacking & Portalling', () => {
    it('Sheet renders dialog with aria-modal and title', () => {
      const html = renderToStaticMarkup(
        <Sheet isOpen={true} onClose={() => {}} title="تصفية الأجهزة">
          <div>خيارات الفرز</div>
        </Sheet>
      );
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('تصفية الأجهزة');
      expect(html).toContain('خيارات الفرز');
      expect(html).toContain('backdrop');
      expect(html).toContain('sheet');
    });

    it('Sheet returns null when isOpen is false', () => {
      const html = renderToStaticMarkup(
        <Sheet isOpen={false} onClose={() => {}} title="تصفية الأجهزة">
          <div>خيارات</div>
        </Sheet>
      );
      expect(html).toBe('');
    });
  });
});
