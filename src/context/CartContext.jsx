import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { productsApi } from '../api/products';

export const CartContext = createContext(null);
const CART_STORAGE_KEY = 'wex_cart_items';
const CART_PRICE_CHANGES_KEY = 'wex_cart_price_changes';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [priceChanges, setPriceChanges] = useState(() => {
    try {
      const saved = sessionStorage.getItem(CART_PRICE_CHANGES_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable
    }
  }, [items]);

  useEffect(() => {
    try {
      sessionStorage.setItem(CART_PRICE_CHANGES_KEY, JSON.stringify(priceChanges));
    } catch {
      // storage unavailable
    }
  }, [priceChanges]);

  const addItem = (product, quantity = 1) => {
    if (!product || !product.id) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        const newQty = Math.min(10, existing.quantity + quantity);
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: newQty } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price_sdg: Number(product.price_sdg) || 0,
          image: product.image,
          quantity: Math.min(10, Math.max(1, quantity)),
        },
      ];
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    const safeQty = Math.min(10, quantity);
    setItems((prev) =>
      prev.map((i) => (i.id === productId ? { ...i, quantity: safeQty } : i))
    );
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
    setPriceChanges((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const clearCart = () => {
    setItems([]);
    setPriceChanges({});
  };

  /**
   * Re-fetches latest product data from API.
   * If any item's price_sdg changed, records an unconfirmed price change
   * and updates item price.
   */
  const refreshCartPrices = useCallback(async () => {
    if (items.length === 0) return [];

    try {
      // Fetch fresh catalog data
      const res = await productsApi.getProducts({ per_page: 50 });
      const freshProducts = res?.data || [];
      const prodMap = new Map();
      freshProducts.forEach((p) => {
        prodMap.set(p.id, p);
        if (p.slug) prodMap.set(p.slug, p);
      });

      const detectedChanges = {};
      let hasUpdates = false;

      const updatedItems = items.map((item) => {
        const fresh = prodMap.get(item.id) || (item.slug ? prodMap.get(item.slug) : null);
        if (fresh && fresh.price_sdg !== undefined) {
          const freshPrice = Number(fresh.price_sdg);
          const currentPrice = Number(item.price_sdg);

          if (freshPrice !== currentPrice) {
            detectedChanges[item.id] = {
              old_price_sdg: currentPrice,
              new_price_sdg: freshPrice,
              confirmed: false,
            };
            hasUpdates = true;
            return {
              ...item,
              price_sdg: freshPrice,
            };
          }
        }
        return item;
      });

      if (hasUpdates) {
        setItems(updatedItems);
        setPriceChanges((prev) => ({
          ...prev,
          ...detectedChanges,
        }));
      }

      return detectedChanges;
    } catch {
      // Network or API error during background refresh - keep current prices
      return {};
    }
  }, [items]);

  const confirmPriceChange = useCallback((productId) => {
    setPriceChanges((prev) => {
      if (!prev[productId]) return prev;
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          confirmed: true,
        },
      };
    });
  }, []);

  const confirmAllPriceChanges = useCallback(() => {
    setPriceChanges((prev) => {
      const confirmed = {};
      Object.keys(prev).forEach((key) => {
        confirmed[key] = {
          ...prev[key],
          confirmed: true,
        };
      });
      return confirmed;
    });
  }, []);

  const hasUnconfirmedPriceChanges = useMemo(() => {
    return items.some((item) => {
      const change = priceChanges[item.id];
      return change && !change.confirmed;
    });
  }, [items, priceChanges]);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const estimatedSubtotalSdg = useMemo(
    () => items.reduce((sum, item) => sum + (item.price_sdg || 0) * item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalItems,
        estimatedSubtotalSdg,
        priceChanges,
        refreshCartPrices,
        confirmPriceChange,
        confirmAllPriceChanges,
        hasUnconfirmedPriceChanges,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
