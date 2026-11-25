import { describe, it, expect } from 'vitest';
import {
  normalizeShopInfo,
  buildWhatsAppLink,
  DEFAULT_SHOP_SETTINGS,
} from '../utils/shopSettings';

describe('Shop Settings Normalization & WhatsApp Utility Tests', () => {
  it('normalizes empty or null shop info with safe brand defaults', () => {
    const info = normalizeShopInfo(null);
    expect(info.name).toBe(DEFAULT_SHOP_SETTINGS.shop_name);
    expect(info.shop_name).toBe(DEFAULT_SHOP_SETTINGS.shop_name);
    expect(info.address).toBe(DEFAULT_SHOP_SETTINGS.shop_address);
    expect(info.shop_address).toBe(DEFAULT_SHOP_SETTINGS.shop_address);
    expect(info.workingHours).toBe(DEFAULT_SHOP_SETTINGS.working_hours);
    expect(info.working_hours).toBe(DEFAULT_SHOP_SETTINGS.working_hours);
    expect(info.business_hours).toBe(DEFAULT_SHOP_SETTINGS.working_hours);
    expect(info.whatsapp).toBe(DEFAULT_SHOP_SETTINGS.shop_whatsapp);
    expect(info.phone).toBe(DEFAULT_SHOP_SETTINGS.shop_phone);
    expect(info.orders_enabled).toBe(true);
    expect(info.ticker_enabled).toBe(true);
    expect(info.lock_hours).toBe(4);
  });

  it('unifies snake_case admin settings with camelCase consumer properties', () => {
    const adminSettings = {
      shop_name: 'ويكس أم درمان',
      shop_address: 'الشهداء - مجمع الواحة',
      shop_phone: '0912345678',
      shop_whatsapp: '+249912345678',
      working_hours: 'يومياً 8 ص - 8 م',
      orders_enabled: false,
      ticker_enabled: false,
      lock_hours: 6,
    };

    const info = normalizeShopInfo(adminSettings);
    expect(info.name).toBe('ويكس أم درمان');
    expect(info.shopName).toBe('ويكس أم درمان');
    expect(info.address).toBe('الشهداء - مجمع الواحة');
    expect(info.workingHours).toBe('يومياً 8 ص - 8 م');
    expect(info.business_hours).toBe('يومياً 8 ص - 8 م');
    expect(info.whatsapp).toBe('+249912345678');
    expect(info.whatsapp_number).toBe('+249912345678');
    expect(info.orders_enabled).toBe(false);
    expect(info.ticker_enabled).toBe(false);
    expect(info.lock_hours).toBe(6);
  });

  it('builds direct wa.me links with clean digits and normalized Sudan prefixes', () => {
    expect(buildWhatsAppLink('+249912345678')).toBe('https://wa.me/249912345678');
    expect(buildWhatsAppLink('0912345678')).toBe('https://wa.me/249912345678');
    expect(buildWhatsAppLink('0123456789')).toBe('https://wa.me/249123456789');
    expect(buildWhatsAppLink('٠٩١٢٣٤٥٦٧٨')).toBe('https://wa.me/249912345678');
    expect(buildWhatsAppLink(null)).toBe('https://wa.me/249912300000');
  });

  it('encodes prefilled WhatsApp message parameters safely', () => {
    const link = buildWhatsAppLink('0912345678', 'مرحباً، أود الاستفسار');
    expect(link).toContain('https://wa.me/249912345678?text=');
    expect(link).toContain(encodeURIComponent('مرحباً، أود الاستفسار'));
  });

  it('correctly normalizes string "0", number 0, and string "false" for orders_enabled and ticker_enabled', () => {
    const stringZero = normalizeShopInfo({ orders_enabled: '0', ticker_enabled: '0' });
    expect(stringZero.orders_enabled).toBe(false);
    expect(stringZero.ticker_enabled).toBe(false);

    const numZero = normalizeShopInfo({ orders_enabled: 0, ticker_enabled: 0 });
    expect(numZero.orders_enabled).toBe(false);
    expect(numZero.ticker_enabled).toBe(false);

    const strFalse = normalizeShopInfo({ orders_enabled: 'false', ticker_enabled: 'false' });
    expect(strFalse.orders_enabled).toBe(false);
    expect(strFalse.ticker_enabled).toBe(false);

    const stringOne = normalizeShopInfo({ orders_enabled: '1', ticker_enabled: '1' });
    expect(stringOne.orders_enabled).toBe(true);
    expect(stringOne.ticker_enabled).toBe(true);
  });
});
