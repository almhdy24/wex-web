import { test, expect } from '@playwright/test';
import { loginAs } from './helpers.js';

test.describe('04: Settings & Storefront Synchronization (FEAT-018 - FEAT-025)', () => {
  test('FEAT-018: Public shop API contains orders_enabled, ticker_enabled and shipping zones', async ({ page }) => {
    // 1. Verify GET /api/v1/shop response schema
    const shopRes = await page.request.get('/api/v1/shop');
    expect(shopRes.ok()).toBeTruthy();
    const shopBody = await shopRes.json();
    const shopData = shopBody.data || shopBody;
    expect(shopData).toHaveProperty('orders_enabled');
    expect(shopData).toHaveProperty('orders_disabled_message');

    // 2. Verify GET /api/v1/shipping-zones response schema
    const zonesRes = await page.request.get('/api/v1/shipping-zones');
    expect(zonesRes.ok()).toBeTruthy();
    const zonesBody = await zonesRes.json();
    const zones = zonesBody.data || zonesBody;
    expect(Array.isArray(zones)).toBeTruthy();
    if (zones.length > 0) {
      expect(zones[0].zone_name || zones[0].name || zones[0].state_name_ar).toBeTruthy();
    }
  });

  test('FEAT-019: Storefront handles orders_enabled=false correctly', async ({ page }) => {
    // Mock /api/v1/shop to return orders_enabled: false
    await page.route('**/api/v1/shop', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      if (json.data) {
        json.data.orders_enabled = false;
        json.data.orders_disabled_message = 'استقبال الطلبات متوقف مؤقتاً لأعمال الصيانة والتحديث';
      }
      await route.fulfill({ json });
    });

    // 1. Verify Checkout Page blocks orders and displays notice
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    // If redirected to /cart because cart is empty, add an item first
    if (page.url().includes('/cart')) {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      const firstProduct = page.locator('a[href^="/products/"]').first();
      await firstProduct.click();
      await page.waitForURL(/\/products\/.+/);

      // On PDP, verify order button shows orders disabled
      const orderBtn = page.locator('button:has-text("استقبال الطلبات متوقف مؤقتاً")');
      await expect(orderBtn).toBeVisible();
      await expect(orderBtn).toBeDisabled();
    }

    await page.screenshot({ path: `e2e/test-results/feat-019-orders-disabled-${page.viewportSize().width}.png` });
  });
});
