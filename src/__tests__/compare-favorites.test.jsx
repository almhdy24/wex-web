import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import ComparePage from '../pages/store/ComparePage';
import FavoritesPage from '../pages/store/FavoritesPage';
import { CompareContext } from '../context/CompareContext';
import { FavoritesContext } from '../context/FavoritesContext';
import { CartContext } from '../context/CartContext';

describe('Compare & Favorites Systems Unit Tests', () => {
  const dummyCart = {
    addItem: () => {},
  };

  const sampleProducts = [
    {
      id: 'lap-1',
      name: 'Dell Latitude 7420',
      slug: 'dell-latitude-7420',
      price_sdg: 450000,
      processor: 'Core i5-1145G7',
      ram: '16GB',
      storage: '256GB SSD',
      screen_size: '14 بوصة',
      condition: 'used',
    },
    {
      id: 'lap-2',
      name: 'Lenovo ThinkPad T14',
      slug: 'lenovo-thinkpad-t14',
      price_sdg: 520000,
      processor: 'Core i7-1165G7',
      ram: '16GB',
      storage: '512GB SSD',
      screen_size: '14 بوصة',
      condition: 'used',
    },
  ];

  describe('ComparePage component', () => {
    it('renders empty comparison state when no items selected', () => {
      const emptyCompare = {
        compareItems: [],
        removeFromCompare: () => {},
        clearCompare: () => {},
      };

      const html = renderToStaticMarkup(
        <MemoryRouter>
          <CompareContext.Provider value={emptyCompare}>
            <CartContext.Provider value={dummyCart}>
              <ComparePage />
            </CartContext.Provider>
          </CompareContext.Provider>
        </MemoryRouter>
      );

      expect(html).toContain('لا توجد أجهزة في المقارنة');
      expect(html).toContain('تصفّح الأجهزة');
    });

    it('renders side-by-side comparison table with SDG prices and specs', () => {
      const activeCompare = {
        compareItems: sampleProducts,
        removeFromCompare: () => {},
        clearCompare: () => {},
      };

      const html = renderToStaticMarkup(
        <MemoryRouter>
          <CompareContext.Provider value={activeCompare}>
            <CartContext.Provider value={dummyCart}>
              <ComparePage />
            </CartContext.Provider>
          </CompareContext.Provider>
        </MemoryRouter>
      );

      // Verify Product Names and Prices
      expect(html).toContain('Dell Latitude 7420');
      expect(html).toContain('Lenovo ThinkPad T14');
      expect(html).toContain('450,000 ج.س');
      expect(html).toContain('520,000 ج.س');

      // Verify Specs Labels
      expect(html).toContain('المعالج');
      expect(html).toContain('Core i5-1145G7');
      expect(html).toContain('Core i7-1165G7');
      expect(html).toContain('الذاكرة العشوائية');
      expect(html).toContain('سعة التخزين');

      // Ensure zero customer-facing AED or rate leakage
      expect(html).not.toContain('AED');
      expect(html).not.toContain('درهم');
      expect(html).not.toContain('سعر الصرف');
    });
  });

  describe('FavoritesPage component', () => {
    it('renders empty state when customer has no favorites', () => {
      const emptyFavs = {
        favorites: [],
        toggleFavorite: () => {},
        isFavorite: () => false,
      };

      const html = renderToStaticMarkup(
        <MemoryRouter>
          <FavoritesContext.Provider value={emptyFavs}>
            <CartContext.Provider value={dummyCart}>
              <FavoritesPage />
            </CartContext.Provider>
          </FavoritesContext.Provider>
        </MemoryRouter>
      );

      expect(html).toContain('قائمتك المفضلة فارغة');
      expect(html).toContain('تصفّح أجهزة المتجر');
    });

    it('renders favorited products with quick-add actions and prices', () => {
      const activeFavs = {
        favorites: sampleProducts,
        toggleFavorite: () => {},
        isFavorite: () => true,
      };

      const html = renderToStaticMarkup(
        <MemoryRouter>
          <FavoritesContext.Provider value={activeFavs}>
            <CartContext.Provider value={dummyCart}>
              <FavoritesPage />
            </CartContext.Provider>
          </FavoritesContext.Provider>
        </MemoryRouter>
      );

      expect(html).toContain('الأجهزة المفضلة');
      expect(html).toContain('Dell Latitude 7420');
      expect(html).toContain('Lenovo ThinkPad T14');
      expect(html).toContain('450,000 ج.س');
      expect(html).toContain('520,000 ج.س');
    });
  });
});
