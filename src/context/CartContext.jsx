import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { productsApi } from '../api/products';

export const CartContext = createContext(null);
const CART_STORAGE_KEY = 'wex_cart_items';
const CART_PRICE_CHANGES_KEY = 'wex_cart_price_changes';

/**
 * Stored carts come from older app versions or hand-edited storage. Anything that is not
 * an array of {id, quantity} items would crash every render (items.reduce / items.map).
 */
export function sanitizeStoredCart(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((i) => i && typeof i === 'object' && (typeof i.id === 'number' || typeof i.id === 'string') && i.id !== '')
    .map((i) => ({
      ...i,
      quantity: Math.min(10, Math.max(1, Math.trunc(Number(i.quantity)) || 1)),
      price_sdg: Number.isFinite(Number(i.price_sdg)) ? Number(i.price_sdg) : 0,
    }));
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return sanitizeStoredCart(saved ? JSON.parse(saved) : []);
    } catch {
      return [];
    }
  });

  const [priceChanges, setPriceChanges] = useState(() => {
    try {
      const saved = sessionStorage.getItem(CART_PRICE_CHANGES_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
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
      const stock = product.stock_quantity !== undefined && product.stock_quantity !== null
        ? Number(product.stock_quantity)
        : (existing?.stock_quantity !== undefined ? existing.stock_quantity : 10);
      const maxLimit = Math.max(1, Math.min(10, stock));

      if (existing) {
        const newQty = Math.min(maxLimit, existing.quantity + quantity);
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: newQty, stock_quantity: stock } : i
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
          stock_quantity: stock,
          quantity: Math.min(maxLimit, Math.max(1, quantity)),
        },
      ];
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== productId) return i;
        const maxLimit = i.stock_quantity !== undefined && i.stock_quantity !== null
          ? Math.max(1, Math.min(10, Number(i.stock_quantity)))
          : 10;
        const safeQty = Math.min(maxLimit, quantity);
        return { ...i, quantity: safeQty };
      })
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

  const restoreItem = useCallback((item) => {
    if (!item || !item.id) return;
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

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
        let nextItem = item;

        if (fresh) {
          const freshPrice = fresh.price_sdg !== undefined ? Number(fresh.price_sdg) : Number(item.price_sdg);
          const currentPrice = Number(item.price_sdg);
          const freshStock = fresh.stock_quantity !== undefined && fresh.stock_quantity !== null
            ? Number(fresh.stock_quantity)
            : item.stock_quantity;

          if (freshPrice !== currentPrice) {
            detectedChanges[item.id] = {
              old_price_sdg: currentPrice,
              new_price_sdg: freshPrice,
              confirmed: false,
            };
            hasUpdates = true;
          }

          const maxAllowed = freshStock !== undefined ? Math.max(1, Math.min(10, freshStock)) : 10;
          const adjustedQty = Math.min(maxAllowed, item.quantity);

          if (freshPrice !== currentPrice || freshStock !== item.stock_quantity || adjustedQty !== item.quantity) {
            hasUpdates = true;
            nextItem = {
              ...item,
              price_sdg: freshPrice,
              stock_quantity: freshStock,
              quantity: adjustedQty,
            };
          }
        }
        return nextItem;
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
        restoreItem,
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
