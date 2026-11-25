import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import {
  hasFocusedVisibleClient,
  parsePushPayload,
  validateSameOriginUrl,
} from './utils/swPushHelpers';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// SPA Navigation fallback (never intercept /api/)
const navigationHandler = createHandlerBoundToURL('/index.html');
registerRoute(
  new NavigationRoute(navigationHandler, {
    denylist: [/^\/api\//],
  })
);

// Explicitly NEVER cache authenticated API routes (orders, admin, payment proofs, profile, push, notifications)
registerRoute(
  ({ request, url }) => {
    if (request.mode === 'navigate') return false;
    const pathname = url.pathname;
    if (!pathname.startsWith('/api/')) return false;
    return (
      pathname.includes('/admin') ||
      pathname.includes('/me') ||
      pathname.includes('/orders') ||
      pathname.includes('/payment-proof') ||
      pathname.includes('/push/') ||
      pathname.includes('/notifications')
    );
  },
  new NetworkOnly()
);

// Products carry prices and stock: network first (fresh when online), short cache fallback
// only for slow/offline connections. Never hours-old prices.
const PRODUCT_CACHE_MAX_AGE_SECONDS = 10 * 60;
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/v1/products'),
  new NetworkFirst({
    cacheName: 'wex-catalog-products',
    networkTimeoutSeconds: 4,
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: PRODUCT_CACHE_MAX_AGE_SECONDS }),
      new CacheableResponsePlugin({ statuses: [200] }),
    ],
  })
);

// Categories/brands change rarely: instant from cache, refreshed in the background.
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/v1/categories') || url.pathname.startsWith('/api/v1/brands'),
  new StaleWhileRevalidate({
    cacheName: 'wex-catalog-taxonomy',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [200] }),
    ],
  })
);

// Public shop metadata
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/v1/shop'),
  new NetworkFirst({
    cacheName: 'wex-public-api-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Public product images
registerRoute(
  ({ url }) => url.pathname.startsWith('/uploads/products/'),
  new StaleWhileRevalidate({
    cacheName: 'wex-product-images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
  })
);

// Push notification handler
self.addEventListener('push', (event) => {
  const raw = event.data ? event.data.text() : '';
  const { title, options } = parsePushPayload(raw);

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      if (hasFocusedVisibleClient(windowClients)) {
        // App is focused and visible: show in-app Toast and refresh unread count instead of OS notification
        for (const client of windowClients) {
          client.postMessage({
            type: 'WEX_PUSH_FOREGROUND',
            payload: { title, ...options },
          });
        }
        return;
      }

      await self.registration.showNotification(title, options);

      // Update app badge if supported
      if (self.navigator && typeof self.navigator.setAppBadge === 'function') {
        try {
          await self.navigator.setAppBadge();
        } catch {
          // ignore badge errors
        }
      }
    })()
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const targetPath = validateSameOriginUrl(data.url, self.location.origin);
  const notificationId = data.notificationId || data.notification_id || null;

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      let targetClient = null;
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          targetClient = client;
          break;
        }
      }

      if (targetClient) {
        await targetClient.focus();
        if ('navigate' in targetClient) {
          try {
            await targetClient.navigate(targetPath);
          } catch {
            targetClient.postMessage({
              type: 'WEX_PUSH_NAVIGATE',
              url: targetPath,
              notificationId,
            });
          }
        } else {
          targetClient.postMessage({
            type: 'WEX_PUSH_NAVIGATE',
            url: targetPath,
            notificationId,
          });
        }
      } else if (self.clients.openWindow) {
        await self.clients.openWindow(targetPath);
      }

      // Notify open clients to mark read & refresh unread count
      const refreshedClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of refreshedClients) {
        client.postMessage({
          type: 'WEX_PUSH_CLICKED',
          url: targetPath,
          notificationId,
        });
      }
    })()
  );
});

// Resubscribe on pushsubscriptionchange
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const oldOpts = event.oldSubscription?.options;
        const newSub = oldOpts
          ? await self.registration.pushManager.subscribe(oldOpts)
          : null;

        const windowClients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });
        for (const client of windowClients) {
          client.postMessage({
            type: 'WEX_PUSH_SUBSCRIPTION_CHANGE',
            subscription: newSub ? newSub.toJSON() : null,
          });
        }
      } catch {
        // will be re-synced on next app start
      }
    })()
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'SET_APP_BADGE' && self.navigator) {
    const count = Number(event.data.count || 0);
    if (count > 0 && typeof self.navigator.setAppBadge === 'function') {
      self.navigator.setAppBadge(count).catch(() => {});
    } else if (count === 0 && typeof self.navigator.clearAppBadge === 'function') {
      self.navigator.clearAppBadge().catch(() => {});
    }
  }
});
