/**
 * Lightweight Route Prefetcher for storefront navigation
 */
import { isDataSaver } from './dataSaver';

const prefetchCache = new Set();

const PREFETCH_MAP = {
  '/': () => import('../pages/store/HomePage'),
  '/products': () => import('../pages/store/CatalogPage'),
  '/cart': () => import('../pages/store/CartPage'),
  '/checkout': () => import('../pages/store/CheckoutPage'),
  '/orders': () => import('../pages/store/OrdersPage'),
  '/faq': () => import('../pages/store/FaqPage'),
  '/compare': () => import('../pages/store/ComparePage'),
  '/favorites': () => import('../pages/store/FavoritesPage'),
  '/account': () => import('../pages/store/AccountPage'),
  '/notifications': () => import('../pages/store/NotificationsPage'),
};

export function prefetchRoute(pathname) {
  if (!pathname || prefetchCache.has(pathname) || isDataSaver()) return;
  const loader = PREFETCH_MAP[pathname];
  if (loader) {
    prefetchCache.add(pathname);
    loader().catch(() => {});
  }
}
