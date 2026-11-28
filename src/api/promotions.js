import { api } from './client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const seen = new Set();

export const promotionsApi = {
  /** Active promotions for a placement (web platform). Never throws: failures mean "no promos". */
  async list(placement) {
    try {
      const res = await api.get(`/promotions?placement=${encodeURIComponent(placement)}&platform=web`);
      return Array.isArray(res?.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  /** Fire-and-forget event via sendBeacon (falls back to fetch keepalive). A "view" is sent once per session per promo. */
  track(id, type) {
    const key = `${type}:${id}`;
    if (type === 'view') {
      if (seen.has(key)) return;
      seen.add(key);
    }
    try {
      const url = `${API_BASE_URL}/promotions/${id}/events`;
      const body = JSON.stringify({ type });
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      } else if (typeof fetch === 'function') {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
      }
    } catch {
      /* silent */
    }
  },
};

/** Maps a promotion action to a link target. */
export function promoHref(promo, whatsappNumber) {
  const v = (promo.action_value || '').trim();
  switch (promo.action_type) {
    case 'product':
      return `/products/${encodeURIComponent(v)}`;
    case 'category': {
      const type = { laptops: 'laptop', laptop: 'laptop', phones: 'phone', phone: 'phone', accessories: 'accessory', accessory: 'accessory' }[v];
      return type ? `/products?type=${type}` : '/products';
    }
    case 'filter':
      return `/products?q=${encodeURIComponent(v)}`;
    case 'url':
      return /^https:\/\//i.test(v) ? v : undefined;
    case 'whatsapp': {
      const digits = String(whatsappNumber || '').replace(/\D/g, '');
      if (!digits) return undefined;
      const intl = digits.startsWith('249') ? digits : `249${digits.replace(/^0/, '')}`;
      return `https://wa.me/${intl}?text=${encodeURIComponent(v)}`;
    }
    default:
      return undefined;
  }
}
