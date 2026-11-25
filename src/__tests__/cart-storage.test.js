import { describe, it, expect } from 'vitest';
import { sanitizeStoredCart } from '../context/CartContext';

// WEB-CART-01: malformed persisted carts crashed the storefront on every load.
describe('sanitizeStoredCart', () => {
  it('turns non-arrays into an empty cart', () => {
    for (const bad of [null, {}, { a: 1 }, 'x', 42, true]) {
      expect(sanitizeStoredCart(bad)).toEqual([]);
    }
  });

  it('drops invalid items and clamps quantities', () => {
    const out = sanitizeStoredCart([null, { name: 'no id' }, { id: 3, quantity: 99, price_sdg: '1000' }, { id: 4, quantity: -2, price_sdg: 'x' }]);
    expect(out).toEqual([
      { id: 3, quantity: 10, price_sdg: 1000 },
      { id: 4, quantity: 1, price_sdg: 0 },
    ]);
  });
});
