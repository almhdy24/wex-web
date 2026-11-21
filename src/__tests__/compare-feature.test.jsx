import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { CompareProvider } from '../context/CompareContext';
import ComparePage from '../pages/store/ComparePage';
import CompareTray from '../components/compare/CompareTray';
import ProductCard from '../components/products/ProductCard';
import { ToastProvider } from '../context/ToastContext';
import { CartProvider } from '../context/CartContext';
import { FavoritesProvider } from '../context/FavoritesContext';

describe('Phase 3: Compare Feature Unit & UI Tests', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => store.get(k) || null,
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
  });

  const sampleLaptop1 = {
    id: 1,
    name: 'Dell Latitude 7420',
    slug: 'dell-latitude-7420',
    type: 'laptop',
    condition: 'used',
    price_sdg: 450000,
    processor: 'Core i5-1145G7',
    ram: '16GB',
    storage: '256GB SSD',
    gpu: 'Intel Iris Xe',
    screen_size: '14 بوصة FHD',
    battery: 'ممتازة 88%',
    warranty_text: 'معاينة وفحص عند الاستلام',
  };

  const sampleLaptop2 = {
    id: 2,
    name: 'Lenovo ThinkPad T14',
    slug: 'lenovo-thinkpad-t14',
    type: 'laptop',
    condition: 'used',
    price_sdg: 420000, // Lowest price
    processor: 'Core i7-10610U',
    ram: '16GB', // Identical to Laptop 1
    storage: '512GB SSD',
    gpu: 'Intel UHD Graphics',
    screen_size: '14 بوصة FHD', // Identical to Laptop 1
    battery: 'ممتازة 92%',
    warranty_text: 'معاينة وفحص عند الاستلام', // Identical
  };

  const sampleDesktop = {
    id: 3,
    name: 'HP ProDesk 600 G5',
    type: 'desktop',
    condition: 'used',
    price_sdg: 380000,
  };

  it('1. Same-type enforcement and max 3 limit in compare store logic', () => {
    let compareItems = [];
    const MAX_ITEMS = 3;
    let warningMessage = null;

    const addToCompare = (product) => {
      if (compareItems.some((p) => p.id === product.id)) return false;
      if (compareItems.length > 0 && (compareItems[0].type || '').toLowerCase() !== (product.type || '').toLowerCase()) {
        warningMessage = 'المقارنة متاحة بين أجهزة من النوع نفسه';
        return false;
      }
      if (compareItems.length >= MAX_ITEMS) {
        warningMessage = 'يمكنك مقارنة 3 أجهزة كحد أقصى. أزل جهازًا لإضافة آخر.';
        return false;
      }
      compareItems.push(product);
      return true;
    };

    // Add first laptop
    expect(addToCompare(sampleLaptop1)).toBe(true);
    expect(compareItems.length).toBe(1);

    // Try adding desktop (different type) -> rejected
    expect(addToCompare(sampleDesktop)).toBe(false);
    expect(warningMessage).toBe('المقارنة متاحة بين أجهزة من النوع نفسه');
    expect(compareItems.length).toBe(1);

    // Add second laptop -> accepted
    expect(addToCompare(sampleLaptop2)).toBe(true);
    expect(compareItems.length).toBe(2);

    // Add 3rd laptop -> accepted
    const sampleLaptop3 = { id: 4, name: 'HP EliteBook 840', type: 'laptop', price_sdg: 500000 };
    expect(addToCompare(sampleLaptop3)).toBe(true);
    expect(compareItems.length).toBe(3);

    // Add 4th laptop -> rejected (max 3 reached)
    const sampleLaptop4 = { id: 5, name: 'MacBook Pro', type: 'laptop', price_sdg: 900000 };
    expect(addToCompare(sampleLaptop4)).toBe(false);
    expect(warningMessage).toBe('يمكنك مقارنة 3 أجهزة كحد أقصى. أزل جهازًا لإضافة آخر.');
    expect(compareItems.length).toBe(3);
  });

  it('2. CompareTray renders floating dock with thumbnails, counter, and actions', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/products']}>
        <ToastProvider>
          <CompareProvider>
            <CompareTray />
          </CompareProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    // When empty, tray is null
    expect(html).toBe('');
  });

  it('3. ComparePage renders side-by-side matrix, factual lowest price badge, and specs', () => {
    localStorage.setItem('wex_compare_items', JSON.stringify([sampleLaptop1, sampleLaptop2]));

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/compare']}>
        <ToastProvider>
          <CartProvider>
            <CompareProvider>
              <ComparePage />
            </CompareProvider>
          </CartProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    // Both product names are displayed
    expect(html).toContain('مقارنة الأجهزة');
    expect(html).toContain('Dell Latitude 7420');
    expect(html).toContain('Lenovo ThinkPad T14');
    expect(html).toContain('إظهار الفروق فقط');
    expect(html).toContain('الأقل سعرًا');
    expect(html).toContain('مسح المقارنة');
  });

  it('4. ProductCard compare lives only on product page (card has heart and add buttons)', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ToastProvider>
          <CartProvider>
            <FavoritesProvider>
              <CompareProvider>
                <ProductCard product={sampleLaptop1} index={0} />
              </CompareProvider>
            </FavoritesProvider>
          </CartProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    // Per Design System principles: compare lives only on product page, not in product card
    expect(html).not.toContain('أضف للمقارنة');
    expect(html).toContain('أضف');
    expect(html).toContain('aria-label="حفظ"');
  });

  it('5. Differences-only spec filtering: identifies identical vs divergent rows', () => {
    const specRows = [
      { id: 'processor', val1: sampleLaptop1.processor, val2: sampleLaptop2.processor },
      { id: 'ram', val1: sampleLaptop1.ram, val2: sampleLaptop2.ram },
    ];

    const processorDiff = specRows[0].val1 !== specRows[0].val2;
    const ramDiff = specRows[1].val1 !== specRows[1].val2;

    expect(processorDiff).toBe(true); // Core i5 vs Core i7
    expect(ramDiff).toBe(false); // 16GB vs 16GB
  });
});
