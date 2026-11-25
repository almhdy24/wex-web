/**
 * Idempotency keys for non-repeatable mutations (order creation).
 * The server (POST /orders, Idempotency-Key header) returns the original order
 * when the same key is replayed, so double taps and retries after a timeout
 * never create a second order.
 */

function randomKey() {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  // randomUUID is missing on non-secure origins (e.g. http://192.168.x.x during LAN testing).
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID().replace(/-/g, '');
  }
  if (c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`.padEnd(16, '0');
}

/**
 * Returns {signature, key}: reuses `previous.key` while the payload is unchanged.
 */
export function idempotencyKeyFor(payload, previous) {
  const signature = JSON.stringify(payload);
  if (previous && previous.signature === signature && previous.key) {
    return previous;
  }
  return { signature, key: randomKey() };
}
