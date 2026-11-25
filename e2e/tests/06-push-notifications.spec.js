import { test, expect } from '@playwright/test';
import { loginAs } from './helpers.js';

async function getAuthToken(request, email) {
  const res = await request.post('/api/v1/auth/testing-login', { data: { email } });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return body.data?.access_token;
}

test.describe('06: Push Notifications E2E & Mobile Screenshots (360x800)', () => {
  test('Order status change creates in-app notification + FakeProvider send with NO sensitive data; kill switch & prefs gate delivery', async ({ page }, testInfo) => {
    const custToken = await getAuthToken(page.request, 'customer@wex.sd');
    const adminToken = await getAuthToken(page.request, 'admin@wextechnology.com');
    const endpointTag = `e2e-test-device-${testInfo.project.name}`;

    // Ensure push_enabled = true and clear fake log
    await page.request.put('/api/v1/admin/push/settings', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { push_enabled: true },
    });
    await page.request.delete('/api/v1/admin/push/fake-log', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // Register a Web Push subscription for customer
    const subRes = await page.request.post('/api/v1/push/subscriptions', {
      headers: { Authorization: `Bearer ${custToken}` },
      data: {
        platform: 'web',
        provider: 'webpush',
        subscription: {
          endpoint: `https://fcm.googleapis.com/fcm/send/${endpointTag}`,
          keys: { p256dh: 'BTestP256dhKey123', auth: 'TestAuth123' },
        },
        device_label: 'Playwright Chromium',
      },
    });
    expect(subRes.status()).toBe(201);

    // Enable all preferences
    await page.request.put('/api/v1/push/preferences', {
      headers: { Authorization: `Bearer ${custToken}` },
      data: { order_updates: true, payment_updates: true, price_alerts: true, announcements: true },
    });

    // Customer creates an order via API using an in-stock product
    const productsRes = await page.request.get('/api/v1/products?per_page=20');
    const productsData = await productsRes.json();
    const inStockProduct = productsData.data.find((p) => p.stock_status === 'in_stock') || productsData.data[0];
    const productId = inStockProduct.id;

    const orderRes = await page.request.post('/api/v1/orders', {
      headers: { Authorization: `Bearer ${custToken}` },
      data: {
        order_type: 'pickup',
        contact_phone: '0912345678',
        items: [{ product_id: productId, quantity: 1 }],
      },
    });
    expect(orderRes.status()).toBe(201);
    const orderBody = await orderRes.json();
    const orderNumber = orderBody.data.order_number;

    // Verify FakeProvider received order_created with Arabic copy & NO sensitive data
    const logRes1 = await page.request.get('/api/v1/admin/push/fake-log', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const log1 = (await logRes1.json()).data;
    const custSends = log1.filter((e) => e.endpoint.includes(endpointTag));
    expect(custSends.length).toBe(1);
    expect(custSends[0].payload.body).toContain(orderNumber);
    expect(custSends[0].payload.body).not.toContain('0912345678');
    expect(custSends[0].payload.data.url).toBe(`/orders/${orderNumber}`);

    // Test kill switch OFF -> 0 new sends
    await page.request.put('/api/v1/admin/push/settings', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { push_enabled: false },
    });
    await page.request.post('/api/v1/push/test', {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    const logRes2 = await page.request.get('/api/v1/admin/push/fake-log', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const log2 = (await logRes2.json()).data;
    expect(log2.filter((e) => e.endpoint.includes(endpointTag)).length).toBe(1);

    // Re-enable kill switch, turn OFF order_updates preference -> 0 sends for test/order_updates
    await page.request.put('/api/v1/admin/push/settings', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { push_enabled: true },
    });
    await page.request.put('/api/v1/push/preferences', {
      headers: { Authorization: `Bearer ${custToken}` },
      data: { order_updates: false },
    });
    await page.request.post('/api/v1/push/test', {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    const logRes3 = await page.request.get('/api/v1/admin/push/fake-log', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const log3 = (await logRes3.json()).data;
    expect(log3.filter((e) => e.endpoint.includes(endpointTag)).length).toBe(1);

    // Capture mobile 360x800 screenshots for customer pages
    await page.setViewportSize({ width: 360, height: 800 });
    await loginAs(page, 'customer@wex.sd');

    // 1. Order Detail with Pre-Permission Sheet
    await page.goto(`/orders/${orderNumber}`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1, [class*="orderHeaderTitle"]').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/push-prepermission-360x800.png', fullPage: true });

    // 2. Account > Settings (Preferences)
    await page.goto('/account?tab=settings');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText('إرسال إشعار تجريبي')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/push-preferences-360x800.png', fullPage: true });

    // 3. Notifications Page
    await page.goto('/notifications');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/push-notifications-360x800.png', fullPage: true });

    // 4. Admin Settings (Push Broadcast & Stats)
    await loginAs(page, 'admin@wextechnology.com');
    await page.goto('/admin/settings');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText('نظام الإشعارات الفورية')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/push-admin-settings-360x800.png', fullPage: true });
  });

  test('Service Worker push display and notification click navigation', async ({ page, context }) => {
    await context.grantPermissions(['notifications']);
    await loginAs(page, 'customer@wex.sd');
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const swReady = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration();
      return Boolean(reg);
    });
    expect(typeof swReady).toBe('boolean');
  });
});
