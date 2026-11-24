import { toAsciiDigits } from './formatters';

export const DEFAULT_SHOP_SETTINGS = {
  shop_name: 'ويكس تكنولوجي - Wex Technology',
  shop_address: 'مول الواحة، الشهداء، أم درمان، السودان',
  shop_phone: '0912300000',
  shop_whatsapp: '+249912300000',
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

    orders_enabled: info.orders_enabled !== false,
    orders_disabled_message: info.orders_disabled_message || DEFAULT_SHOP_SETTINGS.orders_disabled_message,
    ticker_enabled: info.ticker_enabled !== false,
    lock_hours: Number(info.lock_hours || info.price_lock_hours || DEFAULT_SHOP_SETTINGS.lock_hours),
  };
}

/**
 * Builds a valid, direct WhatsApp URL (https://wa.me/<digits>?text=...)
 * converting Arabic digits, removing non-digits, and normalizing Sudan prefixes.
 */
export function buildWhatsAppLink(rawPhone, message = '') {
  const defaultPhone = '249912300000';
  if (!rawPhone) {
    return `https://wa.me/${defaultPhone}`;
  }

  const ascii = toAsciiDigits(String(rawPhone));
  let digits = ascii.replace(/\D/g, '');

  if (!digits) {
    digits = defaultPhone;
  } else if (digits.startsWith('09') || digits.startsWith('01')) {
    digits = '249' + digits.substring(1);
  } else if (digits.startsWith('24909') || digits.startsWith('24901')) {
    digits = '249' + digits.substring(4);
  }

  const baseUrl = `https://wa.me/${digits}`;
  if (message && typeof message === 'string' && message.trim()) {
    return `${baseUrl}?text=${encodeURIComponent(message.trim())}`;
  }
  return baseUrl;
}
