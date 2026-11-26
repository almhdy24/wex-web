import { toAsciiDigits } from './formatters';

export const DEFAULT_SHOP_SETTINGS = {
  shop_name: 'ويكس تكنولوجي',
  shop_address: 'مول الواحة، الشهداء، أم درمان، السودان',
  shop_phone: '',
  shop_whatsapp: '',
  working_hours: 'السبت - الخميس: 9:00 ص - 9:00 م',
  orders_enabled: true,
  orders_disabled_message: 'نعتذر، استقبال الطلبات متوقف مؤقتاً وسنعود لاستقبال طلباتكم قريباً.',
  ticker_enabled: true,
  lock_hours: 4,
  app_discount_percent: 3,
  rounding_step_sdg: 500,
  low_stock_threshold: 2,
};

/**
 * Normalizes shop info from backend API (GET /shop or GET /products/shop-info or admin settings)
 * providing unified access to shop address, whatsapp, working hours, and shop name
 * with safe fallbacks and cross-compatible naming.
 */
export function normalizeShopInfo(raw) {
  const info = raw || {};
  const name = info.shop_name || info.name || DEFAULT_SHOP_SETTINGS.shop_name;
  const address = info.shop_address || info.address || DEFAULT_SHOP_SETTINGS.shop_address;
  const phone = info.shop_phone || info.phone || info.contact_phone || DEFAULT_SHOP_SETTINGS.shop_phone;
  const whatsapp = info.shop_whatsapp || info.whatsapp || info.whatsapp_number || DEFAULT_SHOP_SETTINGS.shop_whatsapp;
  const workingHours = info.working_hours || info.business_hours || DEFAULT_SHOP_SETTINGS.working_hours;

  const ordersEnabled = info.orders_enabled !== undefined && info.orders_enabled !== null
    ? (info.orders_enabled !== false && info.orders_enabled !== '0' && info.orders_enabled !== 0 && String(info.orders_enabled) !== 'false')
    : true;

  const tickerEnabled = info.ticker_enabled !== undefined && info.ticker_enabled !== null
    ? (info.ticker_enabled !== false && info.ticker_enabled !== '0' && info.ticker_enabled !== 0 && String(info.ticker_enabled) !== 'false')
    : true;

  return {
    ...info,
    // Canonical properties
    name,
    shopName: name,
    shop_name: name,

    address,
    shop_address: address,

    phone,
    shop_phone: phone,
    contact_phone: phone,

    whatsapp,
    shop_whatsapp: whatsapp,
    whatsapp_number: whatsapp,

    workingHours,
    working_hours: workingHours,
    business_hours: workingHours,

    orders_enabled: ordersEnabled,
    orders_disabled_message: info.orders_disabled_message || DEFAULT_SHOP_SETTINGS.orders_disabled_message,
    ticker_enabled: tickerEnabled,
    lock_hours: Number(info.lock_hours || info.price_lock_hours || DEFAULT_SHOP_SETTINGS.lock_hours),
    lockHours: Number(info.lock_hours || info.price_lock_hours || DEFAULT_SHOP_SETTINGS.lock_hours),
    // Admin-set discount (was hard-coded 3% across cart/checkout/drawer while the server
    // charged the configured one).
    discountPercent: appDiscountPercent(info),
    mapLink: info.shop_map_link || DEFAULT_MAP_LINK,
    shop_map_link: info.shop_map_link || DEFAULT_MAP_LINK,
  };
}

export const DEFAULT_MAP_LINK = 'https://maps.google.com/?q=Al-Waha+Mall+Omdurman';

/** Admin "app discount %" (0–50). Missing -> default 3. */
export function appDiscountPercent(info) {
  const raw = info?.app_discount_percent ?? info?.discountPercent;
  const n = Number(raw);
  if (raw === undefined || raw === null || raw === '' || !Number.isFinite(n)) {
    return DEFAULT_SHOP_SETTINGS.app_discount_percent;
  }
  return Math.min(50, Math.max(0, Math.round(n)));
}

/** Discount amount in SDG for a subtotal, using the admin percentage. */
export function appDiscountAmount(subtotal, info) {
  return Math.round((Number(subtotal) || 0) * appDiscountPercent(info) / 100);
}

/**
 * Builds a valid, direct WhatsApp URL (https://wa.me/<digits>?text=...)
 * converting Arabic digits, removing non-digits, and normalizing Sudan prefixes.
 */
/**
 * Normalises a Sudanese number to international digits (2499XXXXXXXX) or null.
 * Never invents a number: a missing/invalid setting must hide the contact link,
 * not send customers to a placeholder that may belong to a stranger.
 */
function toInternationalDigits(rawPhone) {
  if (!rawPhone) return null;
  let digits = toAsciiDigits(String(rawPhone)).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('09') || digits.startsWith('01')) {
    digits = '249' + digits.substring(1);
  } else if (digits.startsWith('24909') || digits.startsWith('24901')) {
    digits = '249' + digits.substring(4);
  }
  return digits.length >= 9 ? digits : null;
}

export function buildWhatsAppLink(rawPhone, message = '') {
  const digits = toInternationalDigits(rawPhone);
  if (!digits) return null;

  const baseUrl = `https://wa.me/${digits}`;
  if (message && typeof message === 'string' && message.trim()) {
    return `${baseUrl}?text=${encodeURIComponent(message.trim())}`;
  }
  return baseUrl;
}

export function buildTelLink(rawPhone) {
  const digits = toInternationalDigits(rawPhone);
  return digits ? `tel:+${digits}` : null;
}

/**
 * Share-to-anyone WhatsApp link (no recipient): the customer picks the chat.
 * Product shares carry name, price and the page URL.
 */
export function buildWhatsAppShareLink(text) {
  const t = typeof text === 'string' ? text.trim() : '';
  return t ? `https://wa.me/?text=${encodeURIComponent(t)}` : null;
}

export function productShareText(product, url, formattedPrice) {
  if (!product?.name || !url) return '';
  const pricePart = formattedPrice ? ` بسعر ${formattedPrice}` : '';
  return `${product.name}${pricePart} في متجر ويكس تكنولوجي:\n${url}`;
}

export function orderHelpMessage(orderNumber) {
  return orderNumber ? `مرحباً، أودّ الاستفسار عن الطلب رقم ${orderNumber}.` : 'مرحباً، أودّ الاستفسار عن طلب.';
}
