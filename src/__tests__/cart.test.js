import { describe, it, expect, beforeEach } from 'vitest';

// Simulate Cart Context pure operations
describe('Shopping Cart State Operations', () => {
  let cart = [];

  beforeEach(() => {
    cart = [];
  });

  const addToCart = (product, quantity = 1) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    if (existingIndex > -1) {
      const newQty = Math.min(10, Math.min(product.stock_quantity, cart[existingIndex].quantity + quantity));
      cart[existingIndex] = { ...cart[existingIndex], quantity: newQty };
    } else {
      const initialQty = Math.min(10, Math.min(product.stock_quantity, Math.max(1, quantity)));
      cart.push({ product, quantity: initialQty });
    }
  };

  const updateQuantity = (productId, quantity) => {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;
    if (quantity <= 0) {
      cart = cart.filter((i) => i.product.id !== productId);
    } else {
      const capped = Math.min(10, Math.min(item.product.stock_quantity, quantity));
      cart = cart.map((i) => (i.product.id === productId ? { ...i, quantity: capped } : i));
    }
  };

  const removeFromCart = (productId) => {
    cart = cart.filter((item) => item.product.id !== productId);
  };

  it('adds a new product to empty cart', () => {
    const product = { id: 101, name: 'Dell Latitude 5420', price_sdg: 780000, stock_quantity: 5 };
    addToCart(product, 1);
    expect(cart.length).toBe(1);
    expect(cart[0].product.id).toBe(101);
    expect(cart[0].quantity).toBe(1);
  });

  it('caps cart quantity to product available stock', () => {
    const product = { id: 102, name: 'HP EliteBook 840 G8', price_sdg: 975000, stock_quantity: 2 };
    addToCart(product, 5);
    expect(cart[0].quantity).toBe(2);
  });

  it('caps cart quantity to maximum limit of 10 items', () => {
    const product = { id: 103, name: 'Logitech Wireless Mouse', price_sdg: 32500, stock_quantity: 100 };
    addToCart(product, 15);
    expect(cart[0].quantity).toBe(10);
  });

  it('updates quantity of existing item or removes when 0', () => {
    const product = { id: 104, name: 'Dell 65W Type-C Charger', price_sdg: 52000, stock_quantity: 10 };
    addToCart(product, 2);
    updateQuantity(104, 4);
    expect(cart[0].quantity).toBe(4);

    updateQuantity(104, 0);
    expect(cart.length).toBe(0);
  });

  it('removes item from cart completely', () => {
    const productA = { id: 1, name: 'Laptop A', price_sdg: 650000, stock_quantity: 3 };
    const productB = { id: 2, name: 'Laptop B', price_sdg: 1300000, stock_quantity: 3 };
    addToCart(productA, 1);
    addToCart(productB, 1);
    expect(cart.length).toBe(2);

    removeFromCart(1);
    expect(cart.length).toBe(1);
    expect(cart[0].product.id).toBe(2);
  });
});
