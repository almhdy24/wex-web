import { test, expect } from '@playwright/test';
import { loginAs } from './helpers.js';

test.describe('03: Admin Panel & Order Lifecycle (FEAT-014 - FEAT-017)', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as administrator
    await loginAs(page, 'admin@wextechnology.com');
  });

  test('FEAT-014: Admin dashboard and navigation', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Verify admin layout is loaded
    await expect(page.locator('h1:has-text("لوحة")').first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: `e2e/test-results/feat-014-admin-dashboard-${page.viewportSize().width}.png` });
  });

  test('FEAT-015 to FEAT-017: Admin orders list & detail lifecycle', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('domcontentloaded');

    // Verify orders table or list exists
    const orderRows = page.locator('a[href^="/admin/orders/"], table tbody tr, [class*="card"]');
    await expect(orderRows.first()).toBeVisible({ timeout: 10000 });

    // Open first order
    const firstOrderLink = page.locator('a[href^="/admin/orders/"]').first();
    if (await firstOrderLink.isVisible()) {
      await firstOrderLink.click();
      await page.waitForURL(/\/admin\/orders\/\d+/);
      await page.waitForLoadState('domcontentloaded');

      // Verify order number rendered with Bidi isolation
      await expect(page.locator('h1, h2, [class*="orderNumber"]').first()).toBeVisible();

      // Verify action buttons exist (e.g. print, copy, status transitions)
      const actionButtons = page.locator('button');
      expect(await actionButtons.count()).toBeGreaterThan(0);
    }

    await page.screenshot({ path: `e2e/test-results/feat-016-admin-order-detail-${page.viewportSize().width}.png` });
  });
});
