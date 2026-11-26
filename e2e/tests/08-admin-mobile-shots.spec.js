// Mobile admin screenshots for UX review (not assertions). Runs on the Mobile-360x800
// project so every admin screen is captured at phone width to spot layout breakage.
import { test } from '@playwright/test';
import { loginAs } from './helpers.js';

const pages = [
  ['dashboard', '/admin'],
  ['products', '/admin/products'],
  ['product-new', '/admin/products/new'],
  ['orders', '/admin/orders'],
  ['settings', '/admin/settings'],
  ['payment-accounts', '/admin/payment-accounts'],
  ['shipping', '/admin/shipping-zones'],
];

test('capture admin screens at mobile width', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'Mobile-360x800', 'mobile-only capture');
  await loginAs(page, 'admin@wextechnology.com');
  for (const [name, path] of pages) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `test-results/admin-m-${name}.png`, fullPage: true });
  }
  // The product form's specs editor lives near the bottom: open a preset and shoot it.
  await page.goto('/admin/products/new', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const specsTab = page.getByText('المواصفات', { exact: false }).first();
  if (await specsTab.count()) { await specsTab.click().catch(() => {}); await page.waitForTimeout(400); }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/admin-m-specs-bottom.png', fullPage: true });
});
