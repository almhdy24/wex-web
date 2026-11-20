import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';
import { t } from '../content/ar';

export const CompareContext = createContext(null);
const COMPARE_STORAGE_KEY = 'wex_compare_items';
const MAX_COMPARE_ITEMS = 3;

export function CompareProvider({ children }) {
  const { info, warning } = useToast();
  const [compareItems, setCompareItems] = useState(() => {
    try {
      const storage = typeof window !== 'undefined' ? window.localStorage : (typeof localStorage !== 'undefined' ? localStorage : null);
      const saved = storage ? storage.getItem(COMPARE_STORAGE_KEY) : null;
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Cross-tab sync via storage events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e) => {
      if (e.key === COMPARE_STORAGE_KEY) {
        try {
          const updated = e.newValue ? JSON.parse(e.newValue) : [];
          setCompareItems(updated);
        } catch {
          // ignore parsing error
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save to localStorage whenever compareItems change
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareItems));
      }
    } catch {
      // storage unavailable
    }
  }, [compareItems]);

  const addToCompare = useCallback((product) => {
    if (!product || !product.id) return false;

    // Check if already in list
    if (compareItems.some((p) => p.id === product.id)) {
      info({
        title: 'الجهاز مضاف بالفعل إلى المقارنة',
        dedupeKey: `comp-dup-${product.id}`,
      });
      return false;
    }

    // Check product type consistency (same product type only)
    if (compareItems.length > 0) {
      const expectedType = (compareItems[0].type || '').toLowerCase();
      const currentType = (product.type || '').toLowerCase();
      if (expectedType && currentType && expectedType !== currentType) {
        warning({
          title: t('compare.typeMismatchNotice', 'المقارنة متاحة بين أجهزة من النوع نفسه'),
          dedupeKey: 'comp-type-mismatch',
        });
        return false;
      }
    }

    // Check max items limit (max 3)
    if (compareItems.length >= MAX_COMPARE_ITEMS) {
      warning({
        title: t('compare.maxReachedNotice', 'يمكنك مقارنة 3 أجهزة كحد أقصى. أزل جهازًا لإضافة آخر.'),
        action: {
          label: t('compare.manageCompareAction', 'إدارة المقارنة'),
          onClick: () => {
            if (typeof window !== 'undefined') {
              window.location.href = '/compare';
            }
          },
        },
        dedupeKey: 'comp-max',
      });
      return false;
    }

    const nextItems = [...compareItems, product];
    setCompareItems(nextItems);

    info({
      title: t('compare.addedToastTitle', 'أُضيف إلى المقارنة'),
      detail: t('compare.counterText', { current: nextItems.length, max: MAX_COMPARE_ITEMS }),
      action: {
        label: t('compare.viewCompareAction', 'عرض المقارنة'),
        onClick: () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/compare';
          }
        },
      },
      dedupeKey: 'comp-add',
    });

    return true;
  }, [compareItems, info, warning]);

  const removeFromCompare = useCallback((productId, skipToast = false) => {
    const itemToRemove = compareItems.find((p) => p.id === productId);
    if (!itemToRemove) return;

    setCompareItems((prev) => prev.filter((p) => p.id !== productId));

    if (!skipToast) {
      info({
        title: t('compare.removedToastTitle', 'أُزيل من المقارنة'),
        action: {
          label: t('compare.undoAction', 'تراجع'),
          onClick: () => {
            setCompareItems((current) => {
              if (current.length < MAX_COMPARE_ITEMS && !current.some((p) => p.id === itemToRemove.id)) {
                return [...current, itemToRemove];
              }
              return current;
            });
          },
        },
        dedupeKey: `comp-remove-${itemToRemove.id}`,
      });
    }
  }, [compareItems, info]);

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
      addToCompare: () => false,
      removeFromCompare: () => {},
      clearCompare: () => {},
      isInCompare: () => false,
      maxItems: MAX_COMPARE_ITEMS,
    };
  }
  return ctx;
}
