import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// D-10 (web side): fields the pages read must be ones the API sends
// (pinned by wex-api tests/feature/ResponseContractTest.php).
const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

describe('order page field contract', () => {
  it('customer order timeline uses delivery_type (API has no order_type)', () => {
    const src = read('../pages/store/OrderDetailPage.jsx');
    expect(src).not.toMatch(/order\.order_type/);
    expect(src).toMatch(/order\.delivery_type === 'delivery'/);
  });

  it('admin order shows delivery_address and shipping_zone_name, never a made-up area', () => {
    const src = read('../pages/admin/AdminOrderDetailPage.jsx');
    expect(src).not.toMatch(/shipping_state|shipping_address/);
    expect(src).not.toMatch(/\|\| 'الخرطوم'/);
    expect(src).toMatch(/order\.delivery_address/);
    expect(src).toMatch(/order\.shipping_zone_name/);
  });
});
