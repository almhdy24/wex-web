import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { CartContext } from './CartContext';
import { ToastContext } from './ToastContext';
import LatinText from '../components/common/LatinText';
import { t } from '../content/ar';

export const FavoritesContext = createContext(null);

const GUEST_STORAGE_KEY = 'wex_guest_favorites';
const LEGACY_STORAGE_KEY = 'wex_favorite_items';

function getUserStorageKey(userId) {
  return userId ? `wex_user_favorites_${userId}` : GUEST_STORAGE_KEY;
}

function loadFromStorage(key) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(key, items) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // ignore storage quota errors
  }
}

export function FavoritesProvider({ children }) {
  const auth = useContext(AuthContext);
  const cart = useContext(CartContext);
  const toast = useContext(ToastContext);

  const user = auth?.user || null;
  const addItem = cart?.addItem;
  const success = toast?.success;
  const info = toast?.info;

  const userId = user?.id || null;
  const prevUserIdRef = useRef(userId);

  const [favorites, setFavorites] = useState(() => {
    // Initial state: check user storage or guest storage
    const activeKey = getUserStorageKey(userId);
    const existing = loadFromStorage(activeKey);
    if (existing.length > 0) return existing;

    // Check legacy storage migration
    const legacy = loadFromStorage(LEGACY_STORAGE_KEY);
    return legacy;
  });

  // Handle User Login / Logout / Guest Migration
  useEffect(() => {
    const prevUserId = prevUserIdRef.current;
    const currentUserId = userId;

    if (prevUserId !== currentUserId) {
      prevUserIdRef.current = currentUserId;

      if (currentUserId) {
        // User logged in: migrate any guest or legacy items into user's wishlist
        const userKey = getUserStorageKey(currentUserId);
        const userItems = loadFromStorage(userKey);
        const guestItems = loadFromStorage(GUEST_STORAGE_KEY);
        const legacyItems = loadFromStorage(LEGACY_STORAGE_KEY);

        // Merge without duplicates by matching product ID
        const mergedMap = new Map();
        userItems.forEach((p) => { if (p && p.id) mergedMap.set(String(p.id), p); });
        guestItems.forEach((p) => { if (p && p.id) mergedMap.set(String(p.id), p); });
        legacyItems.forEach((p) => { if (p && p.id) mergedMap.set(String(p.id), p); });

        const mergedList = Array.from(mergedMap.values());
        setFavorites(mergedList);
        saveToStorage(userKey, mergedList);

        // Clean up guest and legacy storage keys
        try {
          localStorage.removeItem(GUEST_STORAGE_KEY);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch {
          // ignore
        }
      } else {
        // User logged out: switch to guest storage
        const guestList = loadFromStorage(GUEST_STORAGE_KEY);
        setFavorites(guestList);
      }
    }
  }, [userId]);

  // Persist current favorites whenever they change
  useEffect(() => {
    const key = getUserStorageKey(userId);
    saveToStorage(key, favorites);
  }, [favorites, userId]);

  const isFavorite = useCallback(
    (productId) => {
      if (!productId) return false;
      return favorites.some((p) => String(p.id) === String(productId));
    },
    [favorites]
  );

  const addFavorite = useCallback(
    (product) => {
      if (!product || !product.id) return;
      setFavorites((prev) => {
        if (prev.some((p) => String(p.id) === String(product.id))) {
          return prev;
        }
        success({
          title: t('toast.addedToFavoritesTitle', 'أُضيف إلى المفضلة'),
          detail: <LatinText>{product.name}</LatinText>,
          dedupeKey: `fav-${product.id}`,
        });
        return [...prev, product];
      });
    },
    [success]
  );

  const removeFavorite = useCallback(
    (productId, silent = false) => {
      if (!productId) return;
      setFavorites((prev) => {
        const target = prev.find((p) => String(p.id) === String(productId));
        if (target && !silent) {
          info({
            title: 'أُزيل من المفضلة',
            detail: <LatinText>{target.name}</LatinText>,
            dedupeKey: `fav-rem-${productId}`,
          });
        }
        return prev.filter((p) => String(p.id) !== String(productId));
      });
    },
    [info]
  );

  const toggleFavorite = useCallback(
    (product) => {
      if (!product || !product.id) return;
      if (isFavorite(product.id)) {
        removeFavorite(product.id);
      } else {
        addFavorite(product);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    const key = getUserStorageKey(userId);
    saveToStorage(key, []);
    info('تم إفراغ قائمة الأجهزة المفضلة');
  }, [userId, info]);

  // Move a single product from wishlist directly to cart
  const moveToCart = useCallback(
    (product, removeAfterMove = true) => {
      if (!product || !product.id) return;
      const isOutOfStock =
        product.stock_status === 'out_of_stock' ||
        (product.stock_quantity !== undefined && product.stock_quantity <= 0);

      if (isOutOfStock) {
        info('هذا الجهاز غير متوفر حالياً لإضافته للسلة');
        return;
      }

      addItem(product, 1);
      if (removeAfterMove) {
        removeFavorite(product.id, true);
      }

      success({
        title: 'تم نقل الجهاز إلى سلة المشتريات',
        detail: <LatinText>{product.name}</LatinText>,
        dedupeKey: `fav-cart-${product.id}`,
      });
    },
    [addItem, removeFavorite, success, info]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteCount: favorites.length,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite,
        clearFavorites,
        moveToCart,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    return {
      favorites: [],
      favoriteCount: 0,
      isFavorite: () => false,
      toggleFavorite: () => {},
      addFavorite: () => {},
      removeFavorite: () => {},
      clearFavorites: () => {},
      moveToCart: () => {},
    };
  }
  return ctx;
}
