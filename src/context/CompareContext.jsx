import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';

export const CompareContext = createContext(null);
const COMPARE_STORAGE_KEY = 'wex_compare_items';
const MAX_COMPARE_ITEMS = 3;

export function CompareProvider({ children }) {
  const { info, warning } = useToast();
  const [compareItems, setCompareItems] = useState(() => {
    try {
      const saved = localStorage.getItem(COMPARE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareItems));
    } catch {
      // storage unavailable
    }
  }, [compareItems]);

  const addToCompare = useCallback((product) => {
    if (!product || !product.id) return;
    setCompareItems((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        info('الجهاز مضاف بالفعل إلى المقارنة');
        return prev;
      }
      if (prev.length >= MAX_COMPARE_ITEMS) {
        warning(`يمكنك مقارنة حتى ${MAX_COMPARE_ITEMS} أجهزة في نفس الوقت`);
        return prev;
      }
      info(`تمت إضافة "${product.name}" إلى المقارنة`);
      return [...prev, product];
    });
  }, [info, warning]);

  const removeFromCompare = useCallback((productId) => {
    setCompareItems((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const clearCompare = useCallback(() => {
    setCompareItems([]);
  }, []);

  const isInCompare = useCallback((productId) => {
    return compareItems.some((p) => p.id === productId);
  }, [compareItems]);

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        maxItems: MAX_COMPARE_ITEMS,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    return {
      compareItems: [],
      addToCompare: () => {},
      removeFromCompare: () => {},
      clearCompare: () => {},
      isInCompare: () => false,
      maxItems: MAX_COMPARE_ITEMS,
    };
  }
  return ctx;
}
