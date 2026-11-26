// VIS-01: the product page specs card was empty for accessories (English keys outside the
// six standard rows) and for every product saved from the admin form (Arabic keys).
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { swrCache } from '../utils/swrCache';
import ProductDetailPage from '../pages/store/ProductDetailPage';
import { CartContext } from '../context/CartContext';
import { FavoritesContext } from '../context/FavoritesContext';
import { CompareContext } from '../context/CompareContext';
import { ToastContext } from '../context/ToastContext';

const base = {
  id: 7,
  slug: 'p',
  name: 'منتج',
  price_sdg: 100000,
  stock_status: 'in_stock',
  stock_quantity: 3,
  condition: 'new',
  images: [],
};

function render(product) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <ToastContext.Provider value={{ success: () => {}, error: () => {} }}>
        <CartContext.Provider value={{ addItem: () => {} }}>
          <FavoritesContext.Provider value={{ isFavorite: () => false, toggleFavorite: () => {} }}>
            <CompareContext.Provider value={{ isInCompare: () => false, addToCompare: () => {} }}>
              <ProductDetailPage initialProduct={{ ...base, ...product }} initialLoading={false} />
            </CompareContext.Provider>
          </FavoritesContext.Provider>
        </CartContext.Provider>
      </ToastContext.Provider>
    </MemoryRouter>
  );
}

// SpecValue joins number and unit with a no-break space.
const text = (html) => html.replace(/\u00A0/g, ' ');
const specRowCount = (html) => (html.match(/<span class="[^"]*specLabel/g) || []).length;

describe('product page specs (VIS-01)', () => {
  beforeEach(() => swrCache.clear());

  it('seeded laptop (English standard keys) keeps its rows', () => {
    const html = render({ specs: { cpu: 'Intel Core i5-8250U', ram: '16 GB', storage: '256 GB SSD', gpu: 'UHD 620', screen: '14 بوصة' } });
    expect(html).toContain('Intel Core i5-8250U');
    expect(html).toContain('الذاكرة العشوائية');
    expect(specRowCount(html)).toBe(5);
  });

  it('seeded accessory (English non-standard keys) shows Arabic-labelled rows', () => {
    const html = render({ specs: { power: '65 Watt', output: '19.5V / 3.34A' } });
    expect(html).toContain('القدرة');
    expect(text(html)).toContain('65 Watt');
    expect(html).toContain('الخرج');
    expect(text(html)).toContain('19.5 V / 3.34A');
  });

  it('admin-form product (Arabic keys) maps standard rows and keeps custom ones, no duplicates', () => {
    const html = render({ specs: { 'المعالج': 'Core i7', 'الرام': '8 GB', 'اللون': 'أسود' } });
    expect(html).toContain('Core i7');
    expect(text(html)).toContain('8 GB');
    expect(html).toContain('أسود');
    expect(specRowCount(html)).toBe(3);
    expect((html.match(/>المعالج</g) || []).length).toBe(1);
  });

  it('Arabic spec values are not forced left-to-right', () => {
    const html = render({ specs: { capacity: 'لأجهزة حتى 15.6 بوصة', cpu: 'Intel Core i5' } });
    expect(html).toMatch(/<bdi dir="auto"[^>]*>لأجهزة حتى 15.6/);
    expect(html).toMatch(/<bdi dir="ltr"[^>]*>Intel Core i5/);
  });

  it('never shows a free-form warranty spec as a guarantee', () => {
    const html = render({ specs: { warranty: 'ضمان سنتين', power: '65 Watt' } });
    expect(html).not.toContain('ضمان سنتين');
  });

  it('no specs at all: says so instead of an empty card', () => {
    const html = render({ specs: null });
    expect(html).toContain('لم تُضف مواصفات لهذا المنتج بعد');
    expect(specRowCount(html)).toBe(0);
  });
});
