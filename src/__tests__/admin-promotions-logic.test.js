import { describe, it, expect } from 'vitest';
import { validatePromo, isoToLocalInput, localInputToIso, payloadFrom, EMPTY_PROMO, formatKhartoum } from '../pages/admin/promotions/promoLogic';
import { validateProductForm } from '../pages/admin/productForm/formLogic';

describe('promotion form rules', () => {
  const ok = { ...EMPTY_PROMO, title: 'عرض' };
  it('accepts a minimal text promo', () => {
    expect(validatePromo(ok)).toEqual({});
  });
  it('enforces length limits with Arabic messages', () => {
    const e = validatePromo({ ...ok, title: 'ا'.repeat(61), subtitle: 'ا'.repeat(121), badge_text: 'ا'.repeat(25) });
    ['title', 'subtitle', 'badge_text'].forEach((k) => expect(e[k]).toMatch(/[؀-ۿ]/));
  });
  it('requires CTA text and value for an action; https only for urls', () => {
    expect(validatePromo({ ...ok, action_type: 'url', action_value: 'http://x.com', cta_label: '' })).toMatchObject({
      cta_label: expect.any(String), action_value: expect.any(String),
    });
    expect(validatePromo({ ...ok, action_type: 'url', action_value: 'https://wex-technology.com', cta_label: 'افتح' })).toEqual({});
  });
  it('end must be after start; image layouts need an image', () => {
    expect(validatePromo({ ...ok, starts_at: '2026-12-02T10:00', ends_at: '2026-12-01T10:00' }).ends_at).toBeTruthy();
    expect(validatePromo({ ...ok, layout: 'split' }, { hasImage: false }).image).toBeTruthy();
    expect(validatePromo({ ...ok, layout: 'split' }, { hasImage: true }).image).toBeUndefined();
  });
  it('converts Khartoum local time to UTC and back', () => {
    expect(localInputToIso('2026-11-28T10:00')).toBe('2026-11-28T08:00:00.000Z');
    expect(isoToLocalInput('2026-11-28T08:00:00.000Z')).toBe('2026-11-28T10:00');
    expect(formatKhartoum('2026-11-26T23:48:00.000Z')).toBe('27 نوفمبر 2026 · 1:48 ص');
  });
  it('payload sends UTC dates and numeric flags', () => {
    const p = payloadFrom({ ...ok, starts_at: '2026-11-28T10:00', ends_at: '', is_active: true, show_countdown: false, priority: '5' });
    expect(p).toMatchObject({ starts_at: '2026-11-28T08:00:00.000Z', ends_at: null, is_active: 1, show_countdown: 0, priority: 5 });
  });
});

describe('compare-at price rule on the product form', () => {
  const base = { name: 'HP ProBook 440', type: 'laptop', category_id: '1', condition: 'new', price_aed: '1000', stock_quantity: 1, specs: {} };
  it('must be larger than the selling price', () => {
    expect(validateProductForm({ ...base, compare_at_price: '900' }).compare_at_price).toMatch(/أكبر/);
    expect(validateProductForm({ ...base, compare_at_price: '1200' }).compare_at_price).toBeUndefined();
    expect(validateProductForm({ ...base, compare_at_price: '' }).compare_at_price).toBeUndefined();
  });
});
