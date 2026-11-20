import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';
import LatinText from '../components/common/LatinText';
import { t } from '../content/ar';

export const FavoritesContext = createContext(null);
const FAVORITES_STORAGE_KEY = 'wex_favorite_items';

export function FavoritesProvider({ children }) {
  const { success, info } = useToast();
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // storage unavailable
    }
  }, [favorites]);

  const toggleFavorite = useCallback((product) => {
    if (!product || !product.id) return;
    setFavorites((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        info({
          title: 'أُزيل من المفضلة',
          detail: <LatinText>{product.name}</LatinText>,
          dedupeKey: `fav-rem-${product.id}`,
        });
        return prev.filter((p) => p.id !== product.id);
      } else {
        success({
          title: t('toast.addedToFavoritesTitle', 'أُضيف إلى المفضلة'),
          detail: <LatinText>{product.name}</LatinText>,
          dedupeKey: `fav-${product.id}`,
        });
        return [...prev, product];
      }
    });
  }, [success, info]);

  const isFavorite = useCallback((productId) => {
    return favorites.some((p) => p.id === productId);
  }, [favorites]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
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
      toggleFavorite: () => {},
      isFavorite: () => false,
    };
  }
  return ctx;
}
