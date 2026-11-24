import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { t, ar } from '../content/ar';
import { adminAr } from '../content/admin.ar';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { CartContext } from '../context/CartContext';
import { CompareContext } from '../context/CompareContext';

// Components & Pages to render
import AppBar from '../components/common/AppBar';
import BottomTabBar from '../components/common/BottomTabBar';
import PriceNotice from '../components/common/PriceNotice';
import ProductCard from '../components/products/ProductCard';

const mockProduct = {
  id: 1,
  name: 'ThinkPad T480s',
  brand: 'Lenovo',
  slug: 'thinkpad-t480s',
  type: 'laptop',
  condition: 'used',
  condition_label: 'مستعمل استيراد',
  stock_quantity: 5,
  stock_status: 'in_stock',
  price_sdg: 450000,
  warranty_text: 'معاينة وفحص عند الاستلام',
  specs: [
    { spec_key: 'processor', spec_name: 'المعالج', spec_value: 'Intel Core i5-8250U' },
    { spec_key: 'ram', spec_name: 'الذاكرة (RAM)', spec_value: '16 GB' },
    { spec_key: 'storage', spec_name: 'التخزين', spec_value: '256 GB SSD' },
    { spec_key: 'screen_size', spec_name: 'الشاشة', spec_value: '14" FHD IPS' },
  ],
  images: [{ image_url: '/assets/sample.webp', is_primary: 1 }],
};

const mockAuth = {
  user: { id: 1, name: 'أحمد', phone: '0912345678', role: 'customer' },
  isAuthenticated: true,
  loading: false,
};

const mockToast = {
  show: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

const mockCart = {
  cartItems: [{ ...mockProduct, quantity: 1, unit_price_sdg: 450000 }],
  itemCount: 1,
  addItem: vi.fn(),
  updateQuantity: vi.fn(),
  removeItem: vi.fn(),
  clearCart: vi.fn(),
};

const mockCompare = {
  compareItems: [mockProduct],
  addToCompare: vi.fn(),
  removeFromCompare: vi.fn(),
  clearCompare: vi.fn(),
  isInCompare: () => false,
};

function renderWithProviders(ui) {
  return renderToStaticMarkup(
    <AuthContext.Provider value={mockAuth}>
      <ToastContext.Provider value={mockToast}>
        <CartContext.Provider value={mockCart}>
          <CompareContext.Provider value={mockCompare}>
            <MemoryRouter>{ui}</MemoryRouter>
          </CompareContext.Provider>
        </CartContext.Provider>
      </ToastContext.Provider>
    </AuthContext.Provider>
  );
}

describe('Translation Integrity and Runtime Safety', () => {
  it('t() correctly translates existing keys with interpolation', () => {
    const text = t('priceNotice.full', { hours: 4 });
    expect(text).toContain('4 ساعات');
    expect(text).not.toContain('{hours}');
    expect(text).not.toMatch(/^[a-z]+(\.[a-zA-Z0-9_]+)+$/);
  });

  it('t() throws loudly in development/test on missing key', () => {
    expect(() => t('completely.nonexistent.key')).toThrow(/\[i18n\] Missing translation key/);
  });

  it('t() throws loudly on empty or non-string key in test', () => {
    expect(() => t('')).toThrow(/\[i18n\]/);
    expect(() => t(null)).toThrow(/\[i18n\]/);
  });

  it('PriceNotice renders the exact required Arabic notice', () => {
    const html = renderWithProviders(<PriceNotice hours={4} variant="full" />);
    expect(html).toContain('بعد تأكيد الطلب يبقى السعر ثابتًا لمدة 4 ساعات لتتمكّن من التحويل.');
  });

  it('ProductCard renders without any raw dot keys or corrupted tokens', () => {
    const html = renderWithProviders(<ProductCard product={mockProduct} />);
    const rawKeyRegex = /\b[a-z]{2,15}\.[a-zA-Z0-9_.]+\b/g;
    const matches = html.match(rawKeyRegex) || [];
    const filteredMatches = matches.filter(
      (m) =>
        !m.includes('w3.org') &&
        !m.endsWith('.org') &&
        !m.endsWith('.com') &&
        !m.endsWith('.webp') &&
        !m.endsWith('.jpg') &&
        !m.endsWith('.svg')
    );
    expect(filteredMatches).toHaveLength(0);
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('null');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('[object Object]');
  });

  it('AppBar and BottomTabBar controls have accessible labels', () => {
    const appBarHtml = renderWithProviders(<AppBar title="ويكس تكنولوجي" />);
    expect(appBarHtml).not.toContain('undefined');

    const tabHtml = renderWithProviders(<BottomTabBar />);
    expect(tabHtml).toContain('الرئيسية');
    expect(tabHtml).toContain('المتجر');
  });

  it('All interactive buttons and links in Core UI have visible text or aria-label', () => {
    const sampleHtml = renderWithProviders(
      <div>
        <AppBar title="متجر ويكس" />
        <PriceNotice hours={4} />
        <ProductCard product={mockProduct} />
        <BottomTabBar />
      </div>
    );

    // Verify there are no raw translation placeholders like "product.addToCart"
    expect(sampleHtml).not.toContain('product.addToCart');
    expect(sampleHtml).not.toContain('cart.addedItemSuccess');
    expect(sampleHtml).not.toContain('product.outOfStockBadge');
  });

  it('fails on a dialect and forbidden phrasing blocklist across all translation dictionaries', () => {
    const dialectBlocklist = [
      'مافي',
      'محتاج',
      'حاول تاني',
      'شنو',
      'كدا',
      'عشان',
      'هسع',
      'هسا',
      'الرابط غلط',
      'ادفع الآن',
      'ذكية',
      'حجز السعر',
    ];

    function extractAllStrings(obj, res = []) {
      for (const val of Object.values(obj)) {
        if (typeof val === 'string') {
          res.push(val);
        } else if (val && typeof val === 'object') {
          extractAllStrings(val, res);
        }
      }
      return res;
    }

    const allStrings = [...extractAllStrings(ar), ...extractAllStrings(adminAr)];
    const violations = [];

    for (const text of allStrings) {
      for (const word of dialectBlocklist) {
        if (text.includes(word)) {
          violations.push(`"${word}" found in: "${text}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('fails on English UI jargon (CTA, Hero Slides) in Arabic translation dictionaries', () => {
    const forbiddenEnglishJargon = [
      'Hero Slides',
      'CTA',
    ];

    function extractAllStrings(obj, res = []) {
      for (const val of Object.values(obj)) {
        if (typeof val === 'string') {
          res.push(val);
        } else if (val && typeof val === 'object') {
          extractAllStrings(val, res);
        }
      }
      return res;
    }

    const allStrings = [...extractAllStrings(ar), ...extractAllStrings(adminAr)];
    const violations = [];

    for (const text of allStrings) {
      for (const term of forbiddenEnglishJargon) {
        if (text.includes(term)) {
          violations.push(`Forbidden English "${term}" found in: "${text}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
