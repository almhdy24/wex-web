/**
 * Pure helper functions for the Wex Service Worker (src/sw.js).
 * Extracted for unit testing in jsdom.
 */

export const CRITICAL_EVENT_TYPES = new Set([
  'order_created',
  'payment_approved',
  'payment_rejected',
  'order_ready_pickup',
  'order_out_delivery',
  'price_lock_expiring',
  'admin_new_order',
  'admin_receipt_uploaded',
  'admin_payment_reminder',
]);

/**
 * Safely parse a push event payload (JSON string or object) into showNotification options.
 */
export function parsePushPayload(raw) {
  let parsed = {};
  if (typeof raw === 'string' && raw.trim() !== '') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { body: raw };
    }
  } else if (raw && typeof raw === 'object') {
    parsed = raw;
  }

  const data = parsed.data && typeof parsed.data === 'object' ? parsed.data : {};
  const type = typeof data.type === 'string' ? data.type : 'general';
  const orderNumber = data.orderNumber || data.order_number || null;
  const orderId = data.orderId || data.order_id || null;

  const title = typeof parsed.title === 'string' && parsed.title.trim() !== ''
    ? parsed.title.trim()
    : 'إشعار جديد من ويكس';

  const body = typeof parsed.body === 'string' && parsed.body.trim() !== ''
    ? parsed.body.trim()
    : 'لديك تحديث جديد. اضغط لعرض التفاصيل.';

  const defaultTag = orderNumber
    ? `order-${orderNumber}`
    : orderId
      ? `order-${orderId}`
      : `wex-${type}`;

  const tag = typeof parsed.tag === 'string' && parsed.tag.trim() !== ''
    ? parsed.tag.trim()
    : defaultTag;

  const requireInteraction = typeof parsed.requireInteraction === 'boolean'
    ? parsed.requireInteraction
    : CRITICAL_EVENT_TYPES.has(type);

  return {
    title,
    options: {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
      tag,
      dir: 'rtl',
      lang: 'ar',
      requireInteraction,
      vibrate: [200, 100, 200],
      data: {
        ...data,
        type,
        url: validateSameOriginUrl(data.url),
      },
    },
  };
}

/**
 * Validate a deep link URL so only relative same-origin paths are accepted.
 * Rejects external origins, protocol-relative URLs, and javascript: schemes.
 */
// Default: the running origin (the service worker's or page's), never a hard-coded domain.
export function validateSameOriginUrl(rawUrl, currentOrigin = (typeof self !== 'undefined' && self.location ? self.location.origin : 'http://localhost')) {
  if (typeof rawUrl !== 'string') return '/notifications';
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('//') || trimmed.includes('\\')) return '/notifications';

  // Always parse: a leading '/' alone is not proof of same-origin ('/\\evil.example'
  // resolves to https://evil.example/ in the URL parser and WindowClient.navigate()).
  try {
    const parsed = new URL(trimmed, currentOrigin);
    if (parsed.origin === currentOrigin && (parsed.protocol === 'https:' || parsed.protocol === 'http:')) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/notifications';
    }
  } catch {
    // invalid URL
  }

  return '/notifications';
}

/**
 * Returns true if at least one window client is currently focused and visible.
 */
export function hasFocusedVisibleClient(clientsList) {
  if (!Array.isArray(clientsList)) return false;
  return clientsList.some(
    (c) => c && c.focused === true && (c.visibilityState === 'visible' || c.visibilityState === undefined)
  );
}
