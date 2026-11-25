import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { idempotencyKeyFor } from '../utils/idempotency';

describe('WEB-CHK-01/02 checkout idempotency and payload contract', () => {
  it('reuses the key for an identical payload (double tap / retry)', () => {
    const payload = { order_type: 'pickup', items: [{ product_id: 1, quantity: 1 }] };
    const first = idempotencyKeyFor(payload, null);
    const second = idempotencyKeyFor({ ...payload }, first);
    expect(second.key).toBe(first.key);
    expect(first.key).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  });

  it('issues a new key when the cart changes', () => {
    const a = idempotencyKeyFor({ items: [{ product_id: 1, quantity: 1 }] }, null);
    const b = idempotencyKeyFor({ items: [{ product_id: 1, quantity: 2 }] }, a);
    expect(b.key).not.toBe(a.key);
  });

  it('checkout sends customer_notes (the field the API reads) and the Idempotency-Key header', () => {
    const src = readFileSync(new URL('../pages/store/CheckoutPage.jsx', import.meta.url), 'utf8');
    expect(src).toMatch(/customer_notes:\s*customerNotes/);
    expect(src).not.toMatch(/\bnotes:\s*customerNotes/);
    expect(src).toMatch(/'Idempotency-Key'/);
  });
});
